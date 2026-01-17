import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Transform Node
 * Map and transform JSON data structures
 */
export class TransformNodeExecutor extends BaseNodeExecutor {
    type = 'transform';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const mapping = node.data.mapping || {}; // Key-Value pairs of target: source_path
        const inputData = context.data;

        this.addLog(context, 'info', 'Transforming data...', node.id);

        const result: Record<string, any> = {};

        // Helper to get nested value by dot notation
        const getValue = (obj: any, path: string) => {
            return path.split('.').reduce((acc, part) => acc && acc[part], obj);
        };

        try {
            for (const [targetKey, sourcePath] of Object.entries(mapping)) {
                if (typeof sourcePath === 'string' && sourcePath.startsWith('$')) {
                    // Simple JSONPath-like selector (e.g., $.user.name)
                    const path = sourcePath.substring(2); // Remove $.
                    result[targetKey] = getValue(inputData, path);
                } else {
                    // Literal value
                    result[targetKey] = sourcePath;
                }
            }

            return result;
        } catch (error: any) {
            this.addLog(context, 'error', `Transform Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
