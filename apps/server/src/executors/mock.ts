import { BaseNodeExecutor, ExecutionContext, WorkflowNode } from '@waveforai/core-engine';

export class MockNodeExecutor extends BaseNodeExecutor {
    constructor(public type: string) {
        super();
    }

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        this.addLog(context, 'info', `[Mock] Executing ${this.type} node: ${node.name}`, node.id);

        // Simulate some work
        await new Promise(resolve => setTimeout(resolve, 500));

        this.addLog(context, 'info', `[Mock] Finished ${this.type} node`, node.id);

        return {
            success: true,
            mocked: true,
            nodeType: this.type,
            timestamp: new Date().toISOString()
        };
    }
}
