import { Workflow, WorkflowExecution, WorkflowNode, ExecutionLog, NodeConnection } from './types';

export interface ExecutionContext {
    workflowId: string;
    executionId: string;
    data: Record<string, any>;
    logs: ExecutionLog[];
    nodeResults: Map<string, any>;
}

export abstract class BaseNodeExecutor {
    abstract type: string;

    async validate(node: WorkflowNode): Promise<string[]> {
        return []; // Return array of validation errors
    }

    abstract execute(
        node: WorkflowNode,
        context: ExecutionContext
    ): Promise<Record<string, any>>;

    protected addLog(
        context: ExecutionContext,
        level: ExecutionLog['level'],
        message: string,
        nodeId?: string,
        data?: any
    ) {
        context.logs.push({
            timestamp: new Date(),
            level,
            message,
            nodeId,
            data
        });
    }
}

export class WorkflowExecutor {
    private nodeExecutors: Map<string, BaseNodeExecutor> = new Map();

    registerExecutor(executor: BaseNodeExecutor) {
        this.nodeExecutors.set(executor.type, executor);
    }

    async executeWorkflow(
        workflow: Workflow,
        inputData?: any
    ): Promise<WorkflowExecution> {
        const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const execution: WorkflowExecution = {
            id: executionId,
            workflowId: workflow.id,
            status: 'running',
            input: inputData,
            logs: [],
            startedAt: new Date()
        };

        const context: ExecutionContext = {
            workflowId: workflow.id,
            executionId,
            data: inputData || {},
            logs: execution.logs,
            nodeResults: new Map()
        };

        try {
            // Find start nodes (nodes with no incoming connections)
            const startNodes = this.findStartNodes(workflow);

            for (const node of startNodes) {
                await this.executeNode(node, workflow, context);
            }

            execution.status = 'completed';
            execution.output = context.data;
        } catch (error) {
            execution.status = 'failed';
            context.logs.push({
                timestamp: new Date(),
                level: 'error',
                message: error instanceof Error ? error.message : 'Unknown error',
                data: error
            });
        }

        execution.completedAt = new Date();
        execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

        return execution;
    }

    private async executeNode(
        node: WorkflowNode,
        workflow: Workflow,
        context: ExecutionContext
    ): Promise<void> {
        const executor = this.nodeExecutors.get(node.type);
        if (!executor) {
            // Fallback or skip
            context.logs.push({
                timestamp: new Date(),
                level: 'warn',
                message: `No executor found for node type: ${node.type}`,
                nodeId: node.id
            });
            return;
        }

        // Validate node
        const errors = await executor.validate(node);
        if (errors.length > 0) {
            throw new Error(`Node validation failed: ${errors.join(', ')}`);
        }

        // Prepare input data from previous nodes
        const inputData = this.prepareNodeInput(node, workflow, context);

        // Execute node
        this.addLog(context, 'info', `Executing node: ${node.name || node.data?.label || node.id}`, node.id);

        const startTime = Date.now();
        try {
            const result = await executor.execute(node, { ...context, data: inputData });
            const duration = Date.now() - startTime;

            // Store result
            context.nodeResults.set(node.id, result);
            // Merge result into global data (simplistic approach, can be refined)
            context.data = { ...context.data, ...result };

            this.addLog(
                context,
                'info',
                `Node ${node.name || node.data?.label || node.id} completed in ${duration}ms`,
                node.id,
                { duration, result }
            );
        } catch (err: any) {
            const duration = Date.now() - startTime;
            this.addLog(
                context,
                'error',
                `Node ${node.name || node.data?.label || node.id} failed: ${err.message}`,
                node.id,
                { duration, error: err }
            );
            throw err; // Stop execution on error for now
        }

        // Execute next nodes
        const nextNodes = this.findNextNodes(node.id, workflow);
        for (const nextNode of nextNodes) {
            await this.executeNode(nextNode, workflow, context);
        }
    }

    private findStartNodes(workflow: Workflow): WorkflowNode[] {
        const nodesWithIncoming = new Set(
            workflow.connections.map(conn => conn.target)
        );

        return workflow.nodes.filter(
            node => !nodesWithIncoming.has(node.id)
        );
    }

    private findNextNodes(nodeId: string, workflow: Workflow): WorkflowNode[] {
        const nextNodeIds = workflow.connections
            .filter(conn => conn.source === nodeId)
            .map(conn => conn.target);

        return workflow.nodes.filter(node =>
            nextNodeIds.includes(node.id)
        );
    }

    private prepareNodeInput(
        node: WorkflowNode,
        workflow: Workflow,
        context: ExecutionContext
    ): Record<string, any> {
        const incomingConnections = workflow.connections.filter(
            conn => conn.target === node.id
        );

        const input: Record<string, any> = {};

        for (const connection of incomingConnections) {
            const sourceResult = context.nodeResults.get(connection.source);
            if (sourceResult) {
                // If handles are used, map specifically. Otherwise pass full result.
                if (connection.sourceHandle && connection.targetHandle) {
                    input[connection.targetHandle] = sourceResult[connection.sourceHandle] ?? sourceResult;
                } else {
                    // Merge or assign. For now, let's just merge all inputs.
                    Object.assign(input, sourceResult);
                }
            }
        }
        // Also include global context data if needed
        return { ...context.data, ...input };
    }

    private addLog(
        context: ExecutionContext,
        level: ExecutionLog['level'],
        message: string,
        nodeId?: string,
        data?: any
    ) {
        context.logs.push({
            timestamp: new Date(),
            level,
            message,
            nodeId,
            data
        });
    }
}
