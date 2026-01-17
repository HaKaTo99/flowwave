import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

export class ConditionNodeExecutor extends BaseNodeExecutor {
    type = 'condition';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const { field, operator, value } = node.data;

        // Get the value from context data
        const contextValue = context.data[field];

        let result = false;

        switch (operator) {
            case 'equals':
            case '==':
                result = contextValue == value;
                break;
            case 'not_equals':
            case '!=':
                result = contextValue != value;
                break;
            case 'greater_than':
            case '>':
                result = Number(contextValue) > Number(value);
                break;
            case 'less_than':
            case '<':
                result = Number(contextValue) < Number(value);
                break;
            case 'contains':
                result = String(contextValue).includes(String(value));
                break;
            case 'exists':
                result = contextValue !== undefined && contextValue !== null;
                break;
            case 'is_empty':
                result = !contextValue || (Array.isArray(contextValue) && contextValue.length === 0);
                break;
            default:
                // Try to evaluate as JS expression (be careful in production!)
                try {
                    const expression = node.data.expression;
                    if (expression) {
                        // Simple template replacement
                        const evaluatedExpression = expression.replace(/\$\{(\w+)\}/g, (match: string, key: string) => {
                            return JSON.stringify(context.data[key] ?? null);
                        });
                        result = eval(evaluatedExpression);
                    }
                } catch (e) {
                    this.addLog(context, 'error', `Failed to evaluate expression: ${e}`, node.id);
                }
        }

        this.addLog(
            context,
            'info',
            `Condition evaluated: ${field} ${operator} ${value} = ${result}`,
            node.id
        );

        return {
            condition: result,
            branch: result ? 'true' : 'false',
            evaluated: { field, operator, value, contextValue }
        };
    }
}
