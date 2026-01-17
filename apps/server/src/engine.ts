import { db } from './db';
import { WorkflowExecutor } from '@waveforai/core-engine';
import {
    HttpNodeExecutor,
    WebhookNodeExecutor,
    AIAgentNodeExecutor,
    GeminiNodeExecutor,
    GoogleSheetsNodeExecutor,
    OpenAINodeExecutor,
    SlackNodeExecutor
} from '@waveforai/connectors';
import { MockNodeExecutor } from './executors/mock';

// Initialize Executor Singleton
const executor = new WorkflowExecutor();

// Register Real Executors
executor.registerExecutor(new HttpNodeExecutor());
executor.registerExecutor(new WebhookNodeExecutor());
executor.registerExecutor(new AIAgentNodeExecutor());
executor.registerExecutor(new GeminiNodeExecutor());
executor.registerExecutor(new GoogleSheetsNodeExecutor());
executor.registerExecutor(new OpenAINodeExecutor());
executor.registerExecutor(new SlackNodeExecutor());

// Register Mock Executors for missing/custom types
const mockTypes = [
    'groq', 'proxmox', 'output-parser', 'switch',
    'qdrant', 'algorithm', 'transform',
    'condition', 'anthropic-chat', 'postgres-memory',
    'entra-id', 'jira', 'postgres'
];

mockTypes.forEach(type => {
    executor.registerExecutor(new MockNodeExecutor(type));
});

// Helper to map DB Edge to Connection
const mapEdgesToConnections = (edges: any[]) => {
    return edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle || 'default',
        targetHandle: e.targetHandle || 'default'
    }));
};

export const executeWorkflow = async (workflowId: string, initialInput: any = {}) => {
    // 1. Fetch Workflow
    const workflowRow = await db.workflow.findUnique({ where: { id: workflowId } });
    if (!workflowRow) {
        console.error(`Workflow ${workflowId} not found`);
        return;
    }

    // Parse JSON fields
    const nodes = JSON.parse(workflowRow.nodes as string);
    const edges = JSON.parse(workflowRow.edges as string);

    const workflow = {
        id: workflowRow.id,
        name: workflowRow.name,
        nodes: nodes,
        connections: mapEdgesToConnections(edges),
        version: workflowRow.version || '1.0.0',
        createdAt: workflowRow.createdAt,
        updatedAt: workflowRow.updatedAt
    };

    // 2. Create Execution Record
    const executionRecord = await db.execution.create({
        data: {
            workflowId,
            status: 'running',
            startedAt: new Date(),
            input: JSON.stringify(initialInput)
        }
    });

    console.log(`[Engine] Executing Workflow ${workflow.name} (${executionRecord.id})`);

    try {
        // 3. Execute
        const result = await executor.executeWorkflow(workflow as any, initialInput);

        // 4. Update Execution Record (Success/Fail from Engine Status)
        await db.execution.update({
            where: { id: executionRecord.id },
            data: {
                status: result.status,
                completedAt: result.completedAt,
                output: JSON.stringify(result.output),
                logs: JSON.stringify(result.logs),
                duration: result.duration
            }
        });
        console.log(`[Engine] Execution ${executionRecord.id} completed: ${result.status}`);

    } catch (err: any) {
        console.error(`[Engine] Execution ${executionRecord.id} failed exception:`, err);
        // 5. Update Execution Record (Failure)
        await db.execution.update({
            where: { id: executionRecord.id },
            data: {
                status: 'failed',
                completedAt: new Date(),
                errorMessage: err.message
            }
        });
    }
};

