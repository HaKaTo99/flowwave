import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import cors from '@fastify/cors';
import { db } from './db';
import { WorkflowExecutor } from '@waveforai/core-engine';
import { totalNodeCount } from '@waveforai/connectors';
import { z } from 'zod';
import { initQueue, addWorkflowJob } from './queue';
import { WebSocketServer } from 'ws';
// import { setupWSConnection } from 'y-websocket/bin/utils.js';

// Helper to allow y-websocket to persistence
// Note: In a real implementation, we would implement persistence efficiently.
// For now, we will use the default y-websocket in-memory leveldb persistence or similar if configured,
// BUT specifically here, we want to just enable the signaling server.
// The actual persistence to SQLite would happen via a custom callback or plugin in y-websocket.
// For this MVP step, we focus on enabling the connection.

export interface ServerOptions extends FastifyServerOptions {
    port?: number;
    host?: string;
    databasePath?: string;
}

export class WaveforAIServer {
    private app: FastifyInstance;
    private port: number;
    private host: string;
    private wss: WebSocketServer | undefined;

    constructor(options: ServerOptions = {}) {
        this.port = options.port || 3001;
        this.host = options.host || '0.0.0.0';

        this.app = Fastify({
            logger: {
                level: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
            },
            ...options
        });

        this.registerPlugins();
        this.setupErrorHandler();
        this.setupAuth(); // New Auth Middleware
        this.registerRoutes();
        this.setupUsageRoutes();
        this.setupHealthCheck();
        // Server ready
    }

    private setupErrorHandler() {
        this.app.setErrorHandler((error, request, reply) => {
            this.app.log.error(error);
            const statusCode = error.statusCode || 500;
            reply.status(statusCode).send({
                error: error.message || 'Internal Server Error',
                code: statusCode,
                stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
            });
        });

        this.app.setNotFoundHandler((request, reply) => {
            reply.status(404).send({
                error: `Route ${request.method}:${request.url} not found`,
                code: 404
            });
        });
    }

    private setupAuth() {
        this.app.addHook('preHandler', async (request, reply) => {
            // Public routes
            if (request.url.startsWith('/health') || request.method === 'OPTIONS') {
                return;
            }

            // Simple API Key check
            const apiKey = request.headers['x-api-key'];
            const validKey = process.env.API_KEY || 'flowwave-secret-key'; // Default for dev

            if (apiKey !== validKey) {
                // Temporary: allow requests without key in DEV mode to avoid breaking existing clients immediately
                // In production (docker), force this check.
                if (process.env.NODE_ENV === 'production' && apiKey !== validKey) {
                    reply.code(401).send({ error: 'Unauthorized: Invalid API Key' });
                    return;
                }
            }
        });
    }

    private async registerPlugins() {
        await this.app.register(cors, {
            origin: true,
            credentials: true
        });
    }

    private registerRoutes() {
        // ... (existing routes kept for brevity in this snippet, effectively re-adding them or keeping them)
        // Note: In real replace, we'd include them. I will assume I need to rewrite the whole file content 
        // if I can't selectively replace inside class methods easily without context.
        // But here I'm using replace_file_content with a large range.

        // WORKFLOWS
        this.app.post('/api/workflows', async (req, reply) => {
            const body: any = req.body;
            const workflow = await db.workflow.create({
                data: {
                    name: body.name,
                    description: body.description,
                    nodes: JSON.stringify(body.nodes || []),
                    edges: JSON.stringify(body.edges || []),
                    metadata: JSON.stringify(body.metadata || {})
                }
            });
            return workflow;
        });

        this.app.get('/api/workflows', async (req, reply) => {
            const rows = await db.workflow.findMany({
                orderBy: { updatedAt: 'desc' },
                where: { isDeleted: false }
            });
            return rows.map((row: any) => ({
                ...row,
                nodes: JSON.parse(row.nodes),
                edges: JSON.parse(row.edges),
                metadata: row.metadata ? JSON.parse(row.metadata) : {}
            }));
        });

        this.app.get('/api/workflows/:id', async (req: any, reply) => {
            const { id } = req.params;
            const row = await db.workflow.findUnique({ where: { id } });
            if (!row) return reply.status(404).send({ error: 'Not found' });
            return {
                ...row,
                nodes: JSON.parse(row.nodes),
                edges: JSON.parse(row.edges),
                metadata: row.metadata ? JSON.parse(row.metadata) : {}
            };
        });

        // DELETE Workflow (soft delete)
        this.app.delete('/api/workflows/:id', async (req: any, reply) => {
            const { id } = req.params;
            try {
                await db.workflow.update({
                    where: { id },
                    data: { isDeleted: true }
                });
                return { success: true, id };
            } catch (e) {
                return reply.status(404).send({ error: 'Workflow not found' });
            }
        });

        // EXECUTION
        this.app.post('/api/workflows/:id/execute', async (req: any, reply) => {
            const { id } = req.params;
            await addWorkflowJob(id);
            return { status: 'queued', workflowId: id };
        });


        this.app.get('/api/executions', async (req, reply) => {
            const executions = await db.execution.findMany({
                orderBy: { startedAt: 'desc' },
                take: 50
            });
            return executions.map((ex: any) => ({
                ...ex,
                input: ex.input ? JSON.parse(ex.input) : null,
                output: ex.output ? JSON.parse(ex.output) : null,
                logs: ex.logs ? JSON.parse(ex.logs) : null
            }));
        });

        this.app.delete('/api/executions', async (req, reply) => {
            await db.execution.deleteMany({});
            return { success: true, message: 'History cleared' };
        });
    }

    private setupUsageRoutes() {
        // In-memory usage storage (replace with database in production)
        const userUsage = new Map<string, any>();
        const userTiers = new Map<string, { tier: string; expiresAt?: Date }>();

        // Get user usage
        this.app.get('/api/usage/:userId', async (req: any, reply) => {
            const { userId } = req.params;

            const usage = userUsage.get(userId) || {
                workflows: { used: 0, limit: 10 },
                executions: { used: 0, limit: 100 },
                ragDocs: { used: 0, limit: 100 },
                textToWorkflow: { used: 0, limit: 10 }
            };

            const tierData = userTiers.get(userId);
            const tier = tierData?.tier || 'free';

            // Apply tier limits
            const limits: Record<string, any> = {
                free: { workflows: 10, executions: 100, ragDocs: 100, textToWorkflow: 10 },
                supporter: { workflows: 50, executions: 1000, ragDocs: 1000, textToWorkflow: 100 },
                backer: { workflows: -1, executions: -1, ragDocs: -1, textToWorkflow: -1 },
                organization: { workflows: -1, executions: -1, ragDocs: -1, textToWorkflow: -1 }
            };

            const tierLimits = limits[tier] || limits.free;

            return {
                tier,
                workflows: { used: usage.workflows?.used || 0, limit: tierLimits.workflows },
                executions: { used: usage.executions?.used || 0, limit: tierLimits.executions },
                ragDocs: { used: usage.ragDocs?.used || 0, limit: tierLimits.ragDocs },
                textToWorkflow: { used: usage.textToWorkflow?.used || 0, limit: tierLimits.textToWorkflow }
            };
        });

        // Increment usage
        this.app.post('/api/usage/:userId/increment', async (req: any, reply) => {
            const { userId } = req.params;
            const { feature, amount = 1 } = req.body as any;

            const usage = userUsage.get(userId) || {
                workflows: { used: 0 },
                executions: { used: 0 },
                ragDocs: { used: 0 },
                textToWorkflow: { used: 0 }
            };

            if (usage[feature]) {
                usage[feature].used += amount;
            }

            userUsage.set(userId, usage);

            return { success: true, feature, newCount: usage[feature]?.used || 0 };
        });

        // Get/Set tier
        this.app.get('/api/tier/:userId', async (req: any, reply) => {
            const { userId } = req.params;
            const tierData = userTiers.get(userId);

            return {
                tier: tierData?.tier || 'free',
                expiresAt: tierData?.expiresAt?.toISOString() || null
            };
        });

        this.app.post('/api/tier/:userId', async (req: any, reply) => {
            const { userId } = req.params;
            const { tier, durationDays = 30 } = req.body as any;

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + durationDays);

            userTiers.set(userId, { tier, expiresAt });

            return { success: true, tier, expiresAt: expiresAt.toISOString() };
        });

        // Get all tiers info
        this.app.get('/api/tiers', async (req, reply) => {
            return [
                {
                    id: 'free',
                    name: 'Free',
                    price: { monthly: 0, yearly: 0 },
                    features: ['10 workflows', '100 executions/day', '3 retries', 'Community support']
                },
                {
                    id: 'supporter',
                    name: 'Supporter',
                    price: { monthly: 50000, yearly: 500000 },
                    features: ['50 workflows', '1000 executions/day', '10 retries', 'Priority support']
                },
                {
                    id: 'backer',
                    name: 'Backer',
                    price: { monthly: 200000, yearly: 2000000 },
                    features: ['Unlimited workflows', 'Unlimited executions', 'Custom AI', 'Direct support']
                },
                {
                    id: 'organization',
                    name: 'Organization',
                    price: { monthly: 1000000, yearly: 10000000 },
                    features: ['Everything in Backer', 'Enterprise support', 'SLA', 'Custom development']
                }
            ];
        });
    }

    private setupHealthCheck() {
        this.app.get('/health', async (request, reply) => {
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                features: {
                    nodes: totalNodeCount,
                    aiAgents: true,
                    rag: true,
                    scheduling: true
                }
            };
        });
    }

    async start() {
        try {
            await this.app.listen({
                port: this.port,
                host: this.host
            });
            console.log(`🚀 FlowWave API server running on http://${this.host}:${this.port}`);

            // Yjs WebSocket Server - Disabled for stability (Import issues in Docker)
            // this.wss = new WebSocketServer({ server: this.app.server });
            // this.wss.on('connection', (ws, req) => {
            //     console.log('WS Connection received');
            //     setupWSConnection(ws, req);
            // });
            console.log(`🔌 Yjs WebSocket Server disabled for stability`);

        } catch (err) {
            this.app.log.error(err);
            process.exit(1);
        }
    }
}

// if (require.main === module) {
//     const server = new WaveforAIServer();
//     server.start();
// }
