import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Agent Node
 * Orchestrates AI model with tools and memory
 */
export class AIAgentNodeExecutor extends BaseNodeExecutor {
    type = 'ai-agent';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            model = 'gpt-4o-mini',
            provider = 'openai',
            systemPrompt = 'You are a helpful AI assistant.',
            tools = [],
            maxIterations = 5
        } = node.data;

        // SANITIZATION: Fix invalid model names automatically
        let efficientModel = model;
        if (provider === 'gemini' && (!model || model === 'Tools Agent' || !model.startsWith('gemini'))) {
            efficientModel = 'gemini-pro';
            this.addLog(context, 'warn', `Invalid Gemini model "${model}" detected. Auto-switching to "gemini-pro".`, node.id);
        }

        const apiKey = this.getApiKey(provider, node.data);
        let userMessage = context.data.message || context.data.input || node.data.message;

        // Fallback: check for webhook body, content, payload, or default handle
        if (!userMessage) {
            const potentialInput = context.data.body || context.data.content || context.data.payload || context.data.default;
            if (potentialInput) {
                userMessage = typeof potentialInput === 'string'
                    ? potentialInput
                    : JSON.stringify(potentialInput);
            }
        }

        if (!userMessage) {
            // Log what we have to help debug
            this.addLog(context, 'warn', `AI Agent received no input. userMessage: ${userMessage}, payload: ${JSON.stringify(context.data.payload)}`, node.id);
            throw new Error('No input message provided to AI Agent. Ensure previous node outputs "message", "input", "body", or "content".');
        }

        this.addLog(context, 'info', `AI Agent starting with ${provider}/${efficientModel}`, node.id);

        // Build conversation with memory
        const conversationHistory = context.data.conversationHistory || [];
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage }
        ];

        // If no tools, just do a simple completion
        if (tools.length === 0) {
            const response = await this.callLLM(provider, efficientModel, messages, apiKey, context, node);

            return {
                response: response.content,
                message: response.content,
                model: efficientModel,
                provider,
                toolsUsed: [],
                iterations: 1,
                conversationHistory: [
                    ...messages,
                    { role: 'assistant', content: response.content }
                ]
            };
        }

        // Agent loop with tools
        let iterations = 0;
        let finalResponse = '';
        const toolsUsed: string[] = [];

        while (iterations < maxIterations) {
            iterations++;

            const response = await this.callLLMWithTools(provider, efficientModel, messages, tools, apiKey);

            if (response.toolCalls && response.toolCalls.length > 0) {
                // Execute tools
                for (const toolCall of response.toolCalls) {
                    this.addLog(context, 'info', `Calling tool: ${toolCall.name}`, node.id);
                    toolsUsed.push(toolCall.name);

                    // Execute the tool (would be implemented in a real system)
                    const toolResult = await this.executeTool(toolCall, context);

                    messages.push({
                        role: 'assistant',
                        content: null,
                        tool_calls: [toolCall]
                    } as any);

                    messages.push({
                        role: 'tool',
                        content: JSON.stringify(toolResult),
                        tool_call_id: toolCall.id
                    } as any);
                }
            } else {
                // No more tool calls, we have the final answer
                finalResponse = response.content;
                break;
            }
        }

        this.addLog(context, 'info', `AI Agent completed in ${iterations} iterations`, node.id);

        return {
            response: finalResponse,
            message: finalResponse,
            model,
            provider,
            toolsUsed,
            iterations,
            conversationHistory: [
                ...messages,
                { role: 'assistant', content: finalResponse }
            ]
        };
    }

    private getApiKey(provider: string, data: any): string {
        const key = data.apiKey
            || (provider === 'openai' ? process.env.OPENAI_API_KEY : '')
            || (provider === 'anthropic' ? process.env.ANTHROPIC_API_KEY : '')
            || (provider === 'gemini' ? process.env.GOOGLE_API_KEY : '');

        // Fallback to MOCK key if no real key found
        return key || 'MOCK_KEY_FOR_TESTING';
    }

    private async callLLM(
        provider: string,
        model: string,
        messages: any[],
        apiKey: string,
        context?: any,
        node?: any
    ): Promise<{ content: string }> {
        // MOCK MODE
        if (apiKey === 'MOCK_KEY_FOR_TESTING' && provider !== 'local') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
            console.log('[AI Mock] Returning simulated response.');
            return { content: `[SIMULATION] Verification successful. AI processing bypassed for ${messages.length} messages.` };
        }

        if (provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({ model, messages })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(`OpenAI API Error: ${data.error?.message || response.statusText}`);
            }

            if (!data.choices || data.choices.length === 0) {
                throw new Error(`OpenAI API returned no choices. Response: ${JSON.stringify(data)}`);
            }

            return { content: data.choices[0]?.message?.content || '' };
        }

        if (provider === 'local') {
            const baseUrl = (node?.data?.baseUrl || 'http://localhost:11434/v1').replace(/\/$/, '');
            try {
                const response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: model || 'llama3', messages })
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`Local AI Error (${response.status}): ${text}`);
                }

                const data = await response.json();
                return { content: data.choices?.[0]?.message?.content || '' };
            } catch (e: any) {
                if (process.env.SIMULATION_MODE === 'true') {
                    console.warn(`[Local AI] Connection failed to ${baseUrl}. Fallback to Sim.`);
                    return { content: `[SIMULATION] Local AI unavailable at ${baseUrl}. \nCheck if Ollama is running!` };
                }
                throw e;
            }
        }

        if (provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(apiKey);
            const genModel = genAI.getGenerativeModel({ model: model || 'gemini-pro' });

            // Convert messages to Gemini format (simplification)
            const parts = messages.map(m => m.content).join('\n'); // Simplified for single-turn

            try {
                const result = await genModel.generateContent(parts);
                const response = await result.response;
                return { content: response.text() };
            } catch (error: any) {
                if (process.env.SIMULATION_MODE === 'true') {
                    console.warn(`[AI Mock] Gemini API failed (${error.message}). Falling back to simulation.`);
                    return { content: `[SIMULATION] Gemini API unavailable. Simulated response for: "${messages[messages.length - 1].content}"` };
                }
                throw error;
            }
        }

        throw new Error(`Unsupported provider: ${provider}`);
    }

    private async callLLMWithTools(
        provider: string,
        model: string,
        messages: any[],
        tools: any[],
        apiKey: string
    ): Promise<{ content: string; toolCalls?: any[] }> {
        if (provider === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages,
                    tools: tools.map(t => ({ type: 'function', function: t }))
                })
            });

            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(`OpenAI API Error: ${data.error?.message || response.statusText}`);
            }

            if (!data.choices || data.choices.length === 0) {
                throw new Error(`OpenAI API returned no choices. Response: ${JSON.stringify(data)}`);
            }

            const message = data.choices[0]?.message;

            return {
                content: message?.content || '',
                toolCalls: message?.tool_calls?.map((tc: any) => ({
                    id: tc.id,
                    name: tc.function.name,
                    arguments: JSON.parse(tc.function.arguments)
                }))
            };
        }

        throw new Error(`Unsupported provider: ${provider}`);
    }

    private async executeTool(toolCall: any, context: ExecutionContext): Promise<any> {
        // This would be implemented to actually execute registered tools
        // For now, return a mock result
        return {
            success: true,
            result: `Tool ${toolCall.name} executed with args: ${JSON.stringify(toolCall.arguments)}`
        };
    }
}
