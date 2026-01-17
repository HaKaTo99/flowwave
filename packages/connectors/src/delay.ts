import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

export class DelayNodeExecutor extends BaseNodeExecutor {
    type = 'delay';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const { milliseconds = 1000 } = node.data;

        this.addLog(context, 'info', `Delaying for ${milliseconds}ms`, node.id);

        await new Promise(resolve => setTimeout(resolve, milliseconds));

        return {
            delayed: true,
            duration: milliseconds,
            timestamp: new Date().toISOString()
        };
    }
}
