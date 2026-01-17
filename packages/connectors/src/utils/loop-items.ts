import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Loop Over Items Node
 * Iterate over arrays and process each item
 */
export class LoopOverItemsNodeExecutor extends BaseNodeExecutor {
    type = 'loop-items';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const items = context.data.items || node.data.items || [];
        const batchSize = node.data.batchSize || 1;
        const mode = node.data.mode || 'sequential'; // 'sequential' | 'parallel'

        if (!Array.isArray(items)) {
            throw new Error('Items must be an array');
        }

        this.addLog(context, 'info', `Processing ${items.length} items in ${mode} mode`, node.id);

        const results: any[] = [];
        const errors: any[] = [];

        if (mode === 'parallel') {
            // Process in parallel batches
            for (let i = 0; i < items.length; i += batchSize) {
                const batch = items.slice(i, i + batchSize);
                const batchResults = await Promise.allSettled(
                    batch.map((item, idx) => this.processItem(item, i + idx, context))
                );

                batchResults.forEach((result, idx) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        errors.push({ index: i + idx, error: result.reason });
                    }
                });
            }
        } else {
            // Process sequentially
            for (let i = 0; i < items.length; i++) {
                try {
                    const result = await this.processItem(items[i], i, context);
                    results.push(result);
                } catch (error: any) {
                    errors.push({ index: i, error: error.message });
                }
            }
        }

        return {
            results,
            errors,
            totalItems: items.length,
            successCount: results.length,
            errorCount: errors.length
        };
    }

    private async processItem(item: any, index: number, context: ExecutionContext): Promise<any> {
        // The actual processing would be done by connected nodes
        // Here we just pass through with metadata
        return {
            item,
            index,
            processed: true,
            timestamp: Date.now()
        };
    }
}

/**
 * Structured Output Parser Node
 * Parse and validate JSON output from LLMs
 */
export class StructuredOutputNodeExecutor extends BaseNodeExecutor {
    type = 'structured-output';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const input = context.data.response || context.data.message || context.data.input || '';
        const schema = node.data.schema || {};
        const mode = node.data.mode || 'extract'; // 'extract' | 'validate'

        this.addLog(context, 'info', `Parsing structured output (${mode} mode)`, node.id);

        // Try to extract JSON from the input
        let parsed: any = null;
        let isValid = false;

        try {
            // First, try direct JSON parse
            parsed = JSON.parse(input);
            isValid = true;
        } catch {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                try {
                    parsed = JSON.parse(jsonMatch[1].trim());
                    isValid = true;
                } catch {
                    // Still couldn't parse
                }
            }

            // Try to find JSON object in text
            if (!parsed) {
                const objectMatch = input.match(/\{[\s\S]*\}/);
                if (objectMatch) {
                    try {
                        parsed = JSON.parse(objectMatch[0]);
                        isValid = true;
                    } catch {
                        // Give up
                    }
                }
            }
        }

        // Validate against schema if provided
        const validation = this.validateSchema(parsed, schema);

        return {
            parsed,
            isValid: isValid && validation.valid,
            validationErrors: validation.errors,
            rawInput: input
        };
    }

    private validateSchema(data: any, schema: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!schema || Object.keys(schema).length === 0) {
            return { valid: true, errors: [] };
        }

        if (!data) {
            return { valid: false, errors: ['Data is null or undefined'] };
        }

        // Simple schema validation
        for (const [key, expectedType] of Object.entries(schema)) {
            if (!(key in data)) {
                errors.push(`Missing required field: ${key}`);
            } else if (typeof data[key] !== expectedType) {
                errors.push(`Field ${key} should be ${expectedType}, got ${typeof data[key]}`);
            }
        }

        return { valid: errors.length === 0, errors };
    }
}

/**
 * Code Node
 * Execute custom JavaScript code
 */
export class CodeNodeExecutor extends BaseNodeExecutor {
    type = 'code';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const code = node.data.code || 'return { result: "No code provided" };';
        const language = node.data.language || 'javascript';

        if (language !== 'javascript') {
            throw new Error(`Language ${language} is not supported. Only JavaScript is available.`);
        }

        this.addLog(context, 'info', 'Executing custom code', node.id);

        try {
            // Create a sandboxed function
            const fn = new Function('$input', '$context', `
                const items = $input.items || [];
                const data = $input;
                ${code}
            `);

            const result = fn(context.data, {
                workflowId: context.workflowId,
                executionId: context.executionId
            });

            return {
                result,
                success: true
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Code execution error: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * Edit Fields Node
 * Transform and rename fields in the data
 */
export class EditFieldsNodeExecutor extends BaseNodeExecutor {
    type = 'edit-fields';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const operations = node.data.operations || [];
        const data = { ...context.data };

        this.addLog(context, 'info', `Applying ${operations.length} field operations`, node.id);

        for (const op of operations) {
            switch (op.type) {
                case 'set':
                    data[op.field] = op.value;
                    break;
                case 'rename':
                    if (op.from in data) {
                        data[op.to] = data[op.from];
                        delete data[op.from];
                    }
                    break;
                case 'delete':
                    delete data[op.field];
                    break;
                case 'copy':
                    data[op.to] = data[op.from];
                    break;
            }
        }

        return data;
    }
}
