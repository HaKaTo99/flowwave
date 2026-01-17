import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Algorithm Node
 * Execute arbitrary JavaScript code for complex logic
 */
export class AlgorithmNodeExecutor extends BaseNodeExecutor {
    type = 'algorithm';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const code = node.data.code || 'return input;';
        const inputData = context.data;

        this.addLog(context, 'info', 'Executing custom algorithm...', node.id);

        try {
            // Sandboxed-ish execution using Function constructor
            // In a real production environment, use 'vm2' or 'isolated-vm'
            const algorithm = new Function('input', 'context', `
                try {
                    ${code}
                } catch (e) {
                    throw e;
                }
            `);

            const result = algorithm(inputData, context);

            this.addLog(context, 'info', 'Algorithm executed successfully', node.id);

            return typeof result === 'object' ? result : { result };

        } catch (error: any) {
            this.addLog(context, 'error', `Algorithm Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
