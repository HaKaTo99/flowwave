import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Groq AI Node
 * High-speed inference using Llama 3 / Mixtral via Groq Cloud
 */
export class GroqNodeExecutor extends BaseNodeExecutor {
    type = 'groq';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const apiKey = node.data.apiKey || process.env.GROQ_API_KEY;
        const model = node.data.model || 'llama3-70b-8192';
        const messages = node.data.messages || [
            { role: 'user', content: node.data.prompt || context.data.prompt || '' }
        ];

        if (!apiKey) {
            throw new Error('Groq API Key is required');
        }

        this.addLog(context, 'info', `Calling Groq (${model})...`, node.id);

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: node.data.temperature || 0.7
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Groq API Error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || '';

            return {
                role: 'assistant',
                content,
                model,
                usage: data.usage
            };

        } catch (error: any) {
            this.addLog(context, 'error', `Groq Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
