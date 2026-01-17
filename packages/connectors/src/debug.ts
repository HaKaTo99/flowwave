import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

export class DebugNodeExecutor extends BaseNodeExecutor {
    type = 'debug';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const { message, logLevel = 'info', includeContext = true } = node.data;

        const debugOutput = {
            timestamp: new Date().toISOString(),
            nodeId: node.id,
            nodeName: node.name,
            message: message || 'Debug checkpoint reached',
            contextSnapshot: includeContext ? { ...context.data } : undefined,
            nodeResults: includeContext ? Object.fromEntries(context.nodeResults) : undefined
        };

        // Log to console
        console.log(`[DEBUG ${node.id}]`, JSON.stringify(debugOutput, null, 2));

        // Add to execution logs
        this.addLog(
            context,
            logLevel as 'info' | 'warn' | 'error' | 'debug',
            message || 'Debug checkpoint',
            node.id,
            debugOutput
        );

        return {
            debug: true,
            output: debugOutput
        };
    }
}
