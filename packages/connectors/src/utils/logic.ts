import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Switch Node
 * Route execution based on value matching
 */
export class SwitchNodeExecutor extends BaseNodeExecutor {
    type = 'switch';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const value = node.data.value || context.data.value; // The value to switch on
        const cases = node.data.cases || []; // Array of { case: 'foo', outputHandle: 'handle-1' }
        const defaultHandle = node.data.defaultHandle || 'default';

        this.addLog(context, 'info', `Switch evaluating value: ${value}`, node.id);

        let matchedHandle = defaultHandle;
        let matchedCase = 'default';

        // Find matching case
        for (const c of cases) {
            // Simple equality check (can be expanded to regex etc)
            if (String(c.value) === String(value)) {
                matchedHandle = c.outputHandle || `case-${c.value}`; // Fallback naming
                matchedCase = c.value;
                break;
            }
        }

        this.addLog(context, 'info', `Switch matched case: ${matchedCase} -> Route: ${matchedHandle}`, node.id);

        return {
            switchValue: value,
            matchedCase,
            // The engine handles routing based on 'output' handles, 
            // but for a Switch, typically the Edge Source Handle determines the path.
            // In FlowWave engine, we might need to verify how conditional routing maps edges.
            // For now, return descriptive metadata.
            _route: matchedHandle
        };
    }
}
