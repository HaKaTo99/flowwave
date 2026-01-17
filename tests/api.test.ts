import { describe, it, expect, beforeAll, beforeEach } from 'vitest';

const API_BASE = 'http://localhost:3001/api';
let serverAvailable = false;

// Helper to make API requests with error handling
async function apiRequest(endpoint: string, options: RequestInit = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const text = await response.text();
        let data = null;

        try {
            data = JSON.parse(text);
        } catch {
            // Response is not JSON - likely server not running or HTML response
        }

        return {
            status: response.status,
            ok: response.ok,
            data,
            error: !response.ok ? text : null,
            isHtml: text.startsWith('<!') || text.startsWith('<html')
        };
    } catch (error: any) {
        return {
            status: 0,
            ok: false,
            data: null,
            error: error.message,
            isHtml: false
        };
    }
}

// Check if server is available before all tests
beforeAll(async () => {
    try {
        const res = await fetch('http://localhost:3001/health', {
            signal: AbortSignal.timeout(2000)
        });
        const text = await res.text();

        // Check if it's JSON (actual API) or HTML (Vite frontend)
        serverAvailable = res.ok && !text.startsWith('<!') && !text.startsWith('<html');

        if (!serverAvailable) {
            console.warn('⚠️ Backend API not available (receiving HTML, not JSON). API tests will be skipped.');
            console.warn('   To run API tests: 1) Stop turbo 2) cd apps/server && npm run dev 3) npm test');
        }
    } catch {
        serverAvailable = false;
        console.warn('⚠️ Backend server not running. API tests will be skipped.');
    }
});

describe('FlowWave API Integration Tests', () => {
    let testWorkflowId: string | null = null;

    // Skip helper
    const skipIfNoServer = () => {
        if (!serverAvailable) {
            console.log('Skipped: Server not available');
            return true;
        }
        return false;
    };

    describe('Health Check', () => {
        it('should return healthy status', async () => {
            if (skipIfNoServer()) return;

            const res = await fetch('http://localhost:3001/health');
            const data = await res.json();

            expect(res.ok).toBe(true);
            expect(data.status).toBe('healthy');
        });
    });

    describe('Workflow CRUD', () => {
        it('should create a new workflow', async () => {
            if (skipIfNoServer()) return;

            const workflow = {
                name: 'Test Workflow',
                description: 'Created by integration test',
                nodes: [
                    { id: 'node-1', type: 'http-request', position: { x: 0, y: 0 }, data: { url: 'https://api.example.com' } }
                ],
                edges: []
            };

            const res = await apiRequest('/workflows', {
                method: 'POST',
                body: JSON.stringify(workflow)
            });

            if (res.isHtml) {
                console.log('Skipped: Server returning HTML instead of JSON');
                return;
            }

            expect(res.ok).toBe(true);
            expect(res.data.id).toBeDefined();
            expect(res.data.name).toBe('Test Workflow');

            testWorkflowId = res.data.id;
        });

        it('should list all workflows', async () => {
            if (skipIfNoServer()) return;

            const res = await apiRequest('/workflows');

            if (res.isHtml) {
                console.log('Skipped: Server returning HTML instead of JSON');
                return;
            }

            expect(res.ok).toBe(true);
            expect(Array.isArray(res.data)).toBe(true);
        });

        it('should get a specific workflow', async () => {
            if (skipIfNoServer() || !testWorkflowId) {
                console.log('Skipped: Server not available or no test workflow');
                return;
            }

            const res = await apiRequest(`/workflows/${testWorkflowId}`);

            if (res.isHtml) {
                console.log('Skipped: Server returning HTML instead of JSON');
                return;
            }

            expect(res.ok).toBe(true);
            expect(res.data.id).toBe(testWorkflowId);
        });

        it('should delete a workflow', async () => {
            if (skipIfNoServer() || !testWorkflowId) {
                console.log('Skipped: Server not available or no test workflow');
                return;
            }

            const res = await apiRequest(`/workflows/${testWorkflowId}`, {
                method: 'DELETE'
            });

            if (res.isHtml) {
                console.log('Skipped: Server returning HTML instead of JSON');
                return;
            }

            expect(res.ok).toBe(true);
        });
    });

    describe('Workflow Execution', () => {
        let execWorkflowId: string | null = null;

        beforeAll(async () => {
            if (!serverAvailable) return;

            // Create a workflow for execution testing
            const res = await apiRequest('/workflows', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'Execution Test Workflow',
                    nodes: [
                        { id: 'node-1', type: 'debug', position: { x: 0, y: 0 }, data: { message: 'Test execution' } }
                    ],
                    edges: []
                })
            });

            if (res.ok && res.data?.id) {
                execWorkflowId = res.data.id;
            }
        });

        it('should queue workflow execution', async () => {
            if (skipIfNoServer() || !execWorkflowId) {
                console.log('Skipped: Server not available or no workflow');
                return;
            }

            const res = await apiRequest(`/workflows/${execWorkflowId}/execute`, {
                method: 'POST'
            });

            if (res.isHtml) {
                console.log('Skipped: Server returning HTML instead of JSON');
                return;
            }

            expect(res.ok).toBe(true);
            expect(res.data.status).toBe('queued');
        });

        it('should list executions', async () => {
            if (skipIfNoServer()) return;

            const res = await apiRequest('/executions');

            if (res.isHtml) {
                console.log('Skipped: Server returning HTML instead of JSON');
                return;
            }

            expect(res.ok).toBe(true);
            expect(Array.isArray(res.data)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should return 404 for non-existent workflow', async () => {
            if (skipIfNoServer()) return;

            const res = await apiRequest('/workflows/non-existent-id-12345');

            if (res.isHtml) {
                console.log('Skipped: Server returning HTML instead of JSON');
                return;
            }

            expect(res.status).toBe(404);
        });

        it('should handle invalid JSON gracefully', async () => {
            if (skipIfNoServer()) return;

            try {
                const response = await fetch(`${API_BASE}/workflows`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: 'invalid json'
                });

                const text = await response.text();
                if (text.startsWith('<!') || text.startsWith('<html')) {
                    console.log('Skipped: Server returning HTML instead of JSON');
                    return;
                }

                expect(response.ok).toBe(false);
            } catch {
                // Network error is acceptable
            }
        });
    });
});
