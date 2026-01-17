import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Anthropic (Claude) Node
 */
export class AnthropicNodeExecutor extends BaseNodeExecutor {
    type = 'anthropic-chat';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const apiKey = node.data.apiKey || process.env.ANTHROPIC_API_KEY;
        const model = node.data.model || 'claude-3-opus-20240229';
        const system = node.data.system || 'You are a helpful AI assistant.';
        const messages = node.data.messages || [
            { role: 'user', content: node.data.prompt || context.data.prompt || context.data.input || '' }
        ];

        if (!apiKey) {
            throw new Error('Anthropic API Key is required');
        }

        this.addLog(context, 'info', `Calling Anthropic (${model})...`, node.id);

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    system,
                    messages,
                    max_tokens: node.data.maxTokens || 1024
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Anthropic API Error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const content = data.content[0]?.text || '';

            return {
                role: 'assistant',
                content,
                model,
                usage: data.usage
            };

        } catch (error: any) {
            this.addLog(context, 'error', `Anthropic Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
