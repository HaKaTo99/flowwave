import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Text-to-Workflow Node
 * Generate workflow from natural language using AI
 */
export class TextToWorkflowNodeExecutor extends BaseNodeExecutor {
    type = 'text-to-workflow';

    private systemPrompt = `You are a workflow automation expert. Given a natural language description, generate a workflow definition in JSON format.

The workflow should include:
- nodes: Array of node objects with { id, type, name, position: { x, y }, data: {} }
- edges: Array of edge objects with { id, source, target }

Available node types:
- http-request: Make HTTP API calls
- delay: Wait for specified time
- condition: Branch based on conditions
- ai-agent: Call AI models (OpenAI, Claude)
- openai-chat: Direct OpenAI chat
- email: Send emails
- telegram: Send Telegram messages
- discord: Send Discord messages
- postgres: Database operations
- loop-items: Iterate over arrays
- code: Execute JavaScript

Position nodes from left to right, top to bottom. Start at x:100, y:100, increment x by 250 for sequential nodes.

Respond ONLY with valid JSON, no explanation.`;

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const description = context.data.description || context.data.prompt || node.data.description;

        if (!description) {
            throw new Error('Description is required to generate workflow');
        }

        this.addLog(context, 'info', `Generating workflow from: "${description.substring(0, 50)}..."`, node.id);

        const apiKey = node.data.apiKey || process.env.OPENAI_API_KEY;

        if (!apiKey) {
            throw new Error('OpenAI API key required for text-to-workflow');
        }

        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'gpt-4o',
                    messages: [
                        { role: 'system', content: this.systemPrompt },
                        { role: 'user', content: `Create a workflow for: ${description}` }
                    ],
                    response_format: { type: 'json_object' }
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI Error: ${await response.text()}`);
            }

            const data = await response.json();
            const content = data.choices[0]?.message?.content || '{}';

            let workflow;
            try {
                workflow = JSON.parse(content);
            } catch {
                throw new Error('Failed to parse generated workflow');
            }

            // Validate basic structure
            if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
                workflow.nodes = [];
            }
            if (!workflow.edges || !Array.isArray(workflow.edges)) {
                workflow.edges = [];
            }

            return {
                workflow,
                nodeCount: workflow.nodes.length,
                edgeCount: workflow.edges.length,
                description,
                generated: true
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Generation failed: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * AI Suggest Node
 * Suggest next node based on current workflow context
 */
export class AISuggestNodeExecutor extends BaseNodeExecutor {
    type = 'ai-suggest';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const currentNodes = context.data.nodes || [];
        const goal = context.data.goal || node.data.goal || '';

        const apiKey = node.data.apiKey || process.env.OPENAI_API_KEY;

        const prompt = `Given this workflow context:
Current nodes: ${currentNodes.map((n: any) => n.type).join(' -> ')}
Goal: ${goal}

Suggest the next 3 best nodes to add. For each suggestion:
1. Node type (from available types)
2. Why it makes sense
3. How to configure it

Available types: http-request, delay, condition, ai-agent, email, telegram, postgres, loop-items, code

Respond in JSON: { "suggestions": [{ "type": "...", "reason": "...", "config": {} }] }`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            })
        });

        const data = await response.json();
        const suggestions = JSON.parse(data.choices[0]?.message?.content || '{"suggestions":[]}');

        return {
            suggestions: suggestions.suggestions || [],
            context: {
                currentNodes: currentNodes.length,
                goal
            }
        };
    }
}
