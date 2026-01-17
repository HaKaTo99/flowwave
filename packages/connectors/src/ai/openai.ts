import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

export interface OpenAIConfig {
    apiKey?: string;
    model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo' | 'gpt-4o' | 'gpt-4o-mini';
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
}

export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    name?: string;
}

/**
 * OpenAI Chat Node
 * Connect to OpenAI GPT models for chat completions
 */
export class OpenAINodeExecutor extends BaseNodeExecutor {
    type = 'openai-chat';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const config = node.data as OpenAIConfig;
        const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OpenAI API Key is required. Set it in node config or OPENAI_API_KEY environment variable.');
        }

        const model = config.model || 'gpt-4o-mini';
        const temperature = config.temperature ?? 0.7;
        const maxTokens = config.maxTokens ?? 1000;

        // Get input message from context or node data
        const userMessage = context.data.message || context.data.input || node.data.message || '';

        if (!userMessage) {
            this.addLog(context, 'warn', 'No input message provided', node.id);
            return { response: '', usage: null };
        }

        // Build messages array
        const messages: ChatMessage[] = [];

        // Add system prompt if provided
        if (config.systemPrompt) {
            messages.push({ role: 'system', content: config.systemPrompt });
        }

        // Add conversation history if available
        const history = context.data.conversationHistory || [];
        messages.push(...history);

        // Add current user message
        messages.push({ role: 'user', content: userMessage });

        this.addLog(context, 'info', `Calling OpenAI ${model} with ${messages.length} messages`, node.id);

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature,
                    max_tokens: maxTokens
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenAI API Error: ${error}`);
            }

            const data = await response.json();
            const assistantMessage = data.choices[0]?.message?.content || '';

            this.addLog(context, 'info', `OpenAI responded with ${assistantMessage.length} characters`, node.id);

            return {
                response: assistantMessage,
                message: assistantMessage,
                model,
                usage: data.usage,
                finishReason: data.choices[0]?.finish_reason,
                // Update conversation history
                conversationHistory: [
                    ...messages,
                    { role: 'assistant', content: assistantMessage }
                ]
            };
        } catch (error: any) {
            this.addLog(context, 'error', `OpenAI Error: ${error.message}`, node.id);
            throw error;
        }
    }
}



/**
 * Google Gemini Node
 */
export class GeminiNodeExecutor extends BaseNodeExecutor {
    type = 'gemini-chat';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const apiKey = node.data.apiKey || process.env.GOOGLE_API_KEY;

        if (!apiKey) {
            throw new Error('Google API Key is required');
        }

        const model = node.data.model || 'gemini-pro';
        const userMessage = context.data.message || context.data.input || node.data.message || '';

        if (!userMessage) {
            return { response: '', usage: null };
        }

        this.addLog(context, 'info', `Calling Gemini ${model}`, node.id);

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userMessage }] }],
                        generationConfig: {
                            temperature: node.data.temperature || 0.7,
                            maxOutputTokens: node.data.maxTokens || 1000
                        }
                    })
                }
            );

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Gemini API Error: ${error}`);
            }

            const data = await response.json();
            const assistantMessage = data.candidates[0]?.content?.parts[0]?.text || '';

            return {
                response: assistantMessage,
                message: assistantMessage,
                model
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Gemini Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
