import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowExecutor, BaseNodeExecutor, ExecutionContext } from '../packages/core-engine/src/executor';
import { WorkflowNode, Workflow, ExecutionLog } from '../packages/core-engine/src/types';

// Mock Node Executor for testing
class MockNodeExecutor extends BaseNodeExecutor {
    type = 'mock';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        return {
            executed: true,
            nodeId: node.id,
            mockData: node.data.value || 'default'
        };
    }
}

// Async Mock Node for testing delays
class AsyncMockNodeExecutor extends BaseNodeExecutor {
    type = 'async-mock';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const delay = node.data.delay || 100;
        await new Promise(resolve => setTimeout(resolve, delay));
        return {
            executed: true,
            delayed: delay
        };
    }
}

// Failing Node for error testing
class FailingNodeExecutor extends BaseNodeExecutor {
    type = 'failing';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        throw new Error('Intentional failure for testing');
    }
}

describe('WorkflowExecutor', () => {
    let executor: WorkflowExecutor;

    beforeEach(() => {
        executor = new WorkflowExecutor();
        executor.registerExecutor(new MockNodeExecutor());
        executor.registerExecutor(new AsyncMockNodeExecutor());
        executor.registerExecutor(new FailingNodeExecutor());
    });

    describe('Basic Execution', () => {
        it('should execute a simple single-node workflow', async () => {
            const workflow: Workflow = {
                id: 'test-workflow-1',
                name: 'Test Workflow',
                nodes: [{
                    id: 'node-1',
                    type: 'mock',
                    name: 'Mock Node',
                    position: { x: 0, y: 0 },
                    data: { value: 'test-value' }
                }],
                connections: [],
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const execution = await executor.executeWorkflow(workflow);

            expect(execution.status).toBe('completed');
            expect(execution.output).toBeDefined();
            expect(execution.output.mockData).toBe('test-value');
            expect(execution.logs.length).toBeGreaterThan(0);
        });

        it('should execute a multi-node sequential workflow', async () => {
            const workflow: Workflow = {
                id: 'test-workflow-2',
                name: 'Sequential Workflow',
                nodes: [
                    { id: 'node-1', type: 'mock', name: 'First', position: { x: 0, y: 0 }, data: { value: 'first' } },
                    { id: 'node-2', type: 'mock', name: 'Second', position: { x: 100, y: 0 }, data: { value: 'second' } }
                ],
                connections: [
                    { id: 'edge-1', source: 'node-1', target: 'node-2' }
                ],
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const execution = await executor.executeWorkflow(workflow);

            expect(execution.status).toBe('completed');
            // Duration may be 0 for very fast executions, so we just check it's defined
            expect(execution.duration).toBeDefined();
            expect(typeof execution.duration).toBe('number');
        });
    });

    describe('Error Handling', () => {
        it('should handle node execution failure', async () => {
            const workflow: Workflow = {
                id: 'test-workflow-fail',
                name: 'Failing Workflow',
                nodes: [{
                    id: 'fail-node',
                    type: 'failing',
                    name: 'Failing Node',
                    position: { x: 0, y: 0 },
                    data: {}
                }],
                connections: [],
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const execution = await executor.executeWorkflow(workflow);

            expect(execution.status).toBe('failed');
            expect(execution.logs.some(log => log.level === 'error')).toBe(true);
        });

        it('should handle unknown node type gracefully', async () => {
            const workflow: Workflow = {
                id: 'test-workflow-unknown',
                name: 'Unknown Node Workflow',
                nodes: [{
                    id: 'unknown-node',
                    type: 'non-existent-type',
                    name: 'Unknown Node',
                    position: { x: 0, y: 0 },
                    data: {}
                }],
                connections: [],
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const execution = await executor.executeWorkflow(workflow);

            // Should complete but with warnings
            expect(execution.logs.some(log => log.level === 'warn')).toBe(true);
        });
    });

    describe('Async Execution', () => {
        it('should handle async node execution', async () => {
            const workflow: Workflow = {
                id: 'test-workflow-async',
                name: 'Async Workflow',
                nodes: [{
                    id: 'async-node',
                    type: 'async-mock',
                    name: 'Async Node',
                    position: { x: 0, y: 0 },
                    data: { delay: 50 }
                }],
                connections: [],
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const execution = await executor.executeWorkflow(workflow);

            expect(execution.status).toBe('completed');
            expect(execution.duration).toBeGreaterThanOrEqual(40); // Allow some tolerance
        });
    });

    describe('Input/Output', () => {
        it('should pass input data to workflow', async () => {
            const workflow: Workflow = {
                id: 'test-workflow-input',
                name: 'Input Workflow',
                nodes: [{
                    id: 'node-1',
                    type: 'mock',
                    name: 'Input Node',
                    position: { x: 0, y: 0 },
                    data: {}
                }],
                connections: [],
                version: '1.0.0',
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const inputData = { testKey: 'testValue' };
            const execution = await executor.executeWorkflow(workflow, inputData);

            expect(execution.input).toEqual(inputData);
        });
    });
});

describe('BaseNodeExecutor', () => {
    it('should add logs correctly', () => {
        const executor = new MockNodeExecutor();
        const context: ExecutionContext = {
            workflowId: 'test',
            executionId: 'test-exec',
            data: {},
            logs: [],
            nodeResults: new Map()
        };

        // Access protected method via any cast
        (executor as any).addLog(context, 'info', 'Test message', 'node-1', { extra: 'data' });

        expect(context.logs.length).toBe(1);
        expect(context.logs[0].level).toBe('info');
        expect(context.logs[0].message).toBe('Test message');
        expect(context.logs[0].nodeId).toBe('node-1');
    });
});
