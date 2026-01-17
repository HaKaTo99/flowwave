import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Qdrant Vector DB Node
 * Real implementation using REST API
 */
export class QdrantNodeExecutor extends BaseNodeExecutor {
    type = 'qdrant';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const url = node.data.url || process.env.QDRANT_URL || 'http://localhost:6333';
        const apiKey = node.data.apiKey || process.env.QDRANT_API_KEY;
        const collection = node.data.collection || 'my_collection';
        const operation = node.data.operation || 'search'; // search, upsert, delete
        const vector = node.data.vector || context.data.embeddings || context.data.vector;
        const limit = node.data.limit || 5;

        this.addLog(context, 'info', `Qdrant ${operation} on ${collection}`, node.id);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (apiKey) headers['api-key'] = apiKey;

        try {
            if (operation === 'search') {
                if (!vector) throw new Error('Vector required for search');

                const response = await fetch(`${url}/collections/${collection}/points/search`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        vector,
                        limit,
                        with_payload: true
                    })
                });

                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();
                return { matches: data.result };
            }

            if (operation === 'upsert') {
                const points = node.data.points || context.data.points || [];
                if (points.length === 0 && vector) {
                    // Single point upsert convenience
                    points.push({
                        id: Date.now(),
                        vector,
                        payload: context.data.metadata || {}
                    });
                }

                const response = await fetch(`${url}/collections/${collection}/points?wait=true`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ points })
                });

                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();
                return { success: true, result: data.result };
            }

            throw new Error(`Unknown Qdrant operation: ${operation}`);

        } catch (error: any) {
            this.addLog(context, 'error', `Qdrant Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
