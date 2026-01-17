import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

export interface MemoryMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

// In-memory storage for conversation history (per workflow execution)
const memoryStore = new Map<string, MemoryMessage[]>();

/**
 * Buffer Memory Node
 * Maintains conversation history with a sliding window
 */
export class BufferMemoryNodeExecutor extends BaseNodeExecutor {
    type = 'buffer-memory';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const sessionId = node.data.sessionId || context.executionId;
        const windowSize = node.data.windowSize || 10;
        const action = node.data.action || 'get'; // 'get', 'add', 'clear'

        let messages = memoryStore.get(sessionId) || [];

        switch (action) {
            case 'add':
                const newMessage: MemoryMessage = {
                    role: context.data.role || 'user',
                    content: context.data.message || context.data.content || '',
                    timestamp: Date.now()
                };
                messages.push(newMessage);
                // Apply sliding window
                if (messages.length > windowSize) {
                    messages = messages.slice(-windowSize);
                }
                memoryStore.set(sessionId, messages);
                this.addLog(context, 'info', `Added message to memory (${messages.length} total)`, node.id);
                break;

            case 'clear':
                memoryStore.delete(sessionId);
                messages = [];
                this.addLog(context, 'info', 'Memory cleared', node.id);
                break;

            case 'get':
            default:
                this.addLog(context, 'info', `Retrieved ${messages.length} messages from memory`, node.id);
                break;
        }

        return {
            messages,
            conversationHistory: messages,
            messageCount: messages.length,
            sessionId
        };
    }
}

/**
 * Simple Memory Node
 * Key-value storage for workflow data
 */
export class SimpleMemoryNodeExecutor extends BaseNodeExecutor {
    type = 'simple-memory';

    private static store = new Map<string, any>();

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const action = node.data.action || 'get'; // 'get', 'set', 'delete'
        const key = node.data.key || context.data.key;

        if (!key) {
            throw new Error('Memory key is required');
        }

        let value: any;

        switch (action) {
            case 'set':
                value = node.data.value ?? context.data.value;
                SimpleMemoryNodeExecutor.store.set(key, value);
                this.addLog(context, 'info', `Stored value for key: ${key}`, node.id);
                break;

            case 'delete':
                SimpleMemoryNodeExecutor.store.delete(key);
                this.addLog(context, 'info', `Deleted key: ${key}`, node.id);
                break;

            case 'get':
            default:
                value = SimpleMemoryNodeExecutor.store.get(key);
                this.addLog(context, 'info', `Retrieved value for key: ${key}`, node.id);
                break;
        }

        return {
            key,
            value,
            exists: SimpleMemoryNodeExecutor.store.has(key)
        };
    }
}

/**
 * Conversation Summary Memory
 * Summarizes long conversations to save tokens
 */
export class SummaryMemoryNodeExecutor extends BaseNodeExecutor {
    type = 'summary-memory';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const messages = context.data.conversationHistory || [];
        const summaryThreshold = node.data.summaryThreshold || 10;

        if (messages.length < summaryThreshold) {
            return {
                messages,
                summarized: false,
                summary: null
            };
        }

        // For now, just truncate. In production, you'd call an LLM to summarize
        const recentMessages = messages.slice(-5);
        const summary = `[Summary of ${messages.length - 5} earlier messages]`;

        this.addLog(context, 'info', `Summarized ${messages.length} messages`, node.id);

        return {
            messages: [
                { role: 'system', content: summary },
                ...recentMessages
            ],
            summarized: true,
            summary,
            originalCount: messages.length
        };
    }
}
