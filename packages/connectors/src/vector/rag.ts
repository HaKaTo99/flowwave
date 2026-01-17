import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Embeddings Node
 * Generate text embeddings using various providers
 */
export class EmbeddingsNodeExecutor extends BaseNodeExecutor {
    type = 'embeddings';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            provider = 'openai',
            model = 'text-embedding-3-small',
            text
        } = node.data;

        const inputText = text || context.data.text || context.data.input || '';

        if (!inputText) {
            throw new Error('Text is required for embedding generation');
        }

        this.addLog(context, 'info', `Generating embeddings with ${provider}/${model}`, node.id);

        try {
            let embeddings: number[];

            switch (provider) {
                case 'openai':
                    embeddings = await this.getOpenAIEmbeddings(inputText, model, node.data.apiKey);
                    break;
                case 'cohere':
                    embeddings = await this.getCohereEmbeddings(inputText, model, node.data.apiKey);
                    break;
                default:
                    throw new Error(`Unsupported embedding provider: ${provider}`);
            }

            return {
                embeddings,
                dimensions: embeddings.length,
                provider,
                model,
                textLength: inputText.length
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Embedding error: ${error.message}`, node.id);
            throw error;
        }
    }

    private async getOpenAIEmbeddings(text: string, model: string, apiKey?: string): Promise<number[]> {
        const key = apiKey || process.env.OPENAI_API_KEY;
        if (!key) throw new Error('OpenAI API key required');

        const response = await fetch('https://api.openai.com/v1/embeddings', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                input: text
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI Error: ${await response.text()}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    }

    private async getCohereEmbeddings(text: string, model: string, apiKey?: string): Promise<number[]> {
        const key = apiKey || process.env.COHERE_API_KEY;
        if (!key) throw new Error('Cohere API key required');

        const response = await fetch('https://api.cohere.ai/v1/embed', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                texts: [text],
                model: model || 'embed-english-v3.0',
                input_type: 'search_document'
            })
        });

        if (!response.ok) {
            throw new Error(`Cohere Error: ${await response.text()}`);
        }

        const data = await response.json();
        return data.embeddings[0];
    }
}

/**
 * Text Splitter Node
 * Split text into chunks for RAG
 */
export class TextSplitterNodeExecutor extends BaseNodeExecutor {
    type = 'text-splitter';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            chunkSize = 1000,
            chunkOverlap = 200,
            separator = '\n\n'
        } = node.data;

        const text = context.data.text || context.data.content || node.data.text || '';

        if (!text) {
            return { chunks: [], count: 0 };
        }

        this.addLog(context, 'info', `Splitting text (${text.length} chars) into chunks`, node.id);

        const chunks = this.splitText(text, chunkSize, chunkOverlap, separator);

        return {
            chunks,
            count: chunks.length,
            chunkSize,
            chunkOverlap,
            originalLength: text.length
        };
    }

    private splitText(text: string, chunkSize: number, overlap: number, separator: string): string[] {
        const chunks: string[] = [];

        // First, split by separator
        const sections = text.split(separator);

        let currentChunk = '';

        for (const section of sections) {
            if (currentChunk.length + section.length <= chunkSize) {
                currentChunk += (currentChunk ? separator : '') + section;
            } else {
                if (currentChunk) {
                    chunks.push(currentChunk);
                }

                // Handle sections larger than chunk size
                if (section.length > chunkSize) {
                    const subChunks = this.splitLargeSection(section, chunkSize, overlap);
                    chunks.push(...subChunks.slice(0, -1));
                    currentChunk = subChunks[subChunks.length - 1] || '';
                } else {
                    currentChunk = section;
                }
            }
        }

        if (currentChunk) {
            chunks.push(currentChunk);
        }

        return chunks;
    }

    private splitLargeSection(text: string, chunkSize: number, overlap: number): string[] {
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            const end = Math.min(start + chunkSize, text.length);
            chunks.push(text.slice(start, end));
            start = end - overlap;

            if (start >= text.length) break;
            if (start < 0) start = 0;
        }

        return chunks;
    }
}

/**
 * Vector Store Node (Pinecone)
 * Store and query vectors
 */
export class PineconeNodeExecutor extends BaseNodeExecutor {
    type = 'pinecone';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            operation = 'query', // 'upsert' | 'query' | 'delete'
            apiKey,
            environment,
            indexName,
            namespace = '',
            topK = 5
        } = node.data;

        const key = apiKey || process.env.PINECONE_API_KEY;
        const env = environment || process.env.PINECONE_ENVIRONMENT;

        if (!key || !indexName) {
            throw new Error('Pinecone API key and index name are required');
        }

        this.addLog(context, 'info', `Pinecone ${operation} on ${indexName}`, node.id);

        const baseUrl = `https://${indexName}-${env}.svc.pinecone.io`;

        try {
            switch (operation) {
                case 'upsert':
                    return await this.upsert(baseUrl, key, namespace, context);
                case 'query':
                    return await this.query(baseUrl, key, namespace, topK, context);
                case 'delete':
                    return await this.deleteVectors(baseUrl, key, namespace, context);
                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }
        } catch (error: any) {
            this.addLog(context, 'error', `Pinecone error: ${error.message}`, node.id);
            throw error;
        }
    }

    private async upsert(baseUrl: string, apiKey: string, namespace: string, context: ExecutionContext): Promise<any> {
        const vectors = context.data.vectors || [];

        const response = await fetch(`${baseUrl}/vectors/upsert`, {
            method: 'POST',
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vectors: vectors.map((v: any, i: number) => ({
                    id: v.id || `vec-${Date.now()}-${i}`,
                    values: v.embeddings || v.values,
                    metadata: v.metadata || {}
                })),
                namespace
            })
        });

        if (!response.ok) {
            throw new Error(`Pinecone upsert failed: ${await response.text()}`);
        }

        return {
            success: true,
            upsertedCount: vectors.length
        };
    }

    private async query(baseUrl: string, apiKey: string, namespace: string, topK: number, context: ExecutionContext): Promise<any> {
        const queryVector = context.data.embeddings || context.data.vector || [];

        const response = await fetch(`${baseUrl}/query`, {
            method: 'POST',
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vector: queryVector,
                topK,
                namespace,
                includeMetadata: true
            })
        });

        if (!response.ok) {
            throw new Error(`Pinecone query failed: ${await response.text()}`);
        }

        const data = await response.json();

        return {
            matches: data.matches || [],
            count: data.matches?.length || 0
        };
    }

    private async deleteVectors(baseUrl: string, apiKey: string, namespace: string, context: ExecutionContext): Promise<any> {
        const ids = context.data.ids || [];

        const response = await fetch(`${baseUrl}/vectors/delete`, {
            method: 'POST',
            headers: {
                'Api-Key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ids,
                namespace
            })
        });

        if (!response.ok) {
            throw new Error(`Pinecone delete failed: ${await response.text()}`);
        }

        return {
            success: true,
            deletedIds: ids
        };
    }
}

/**
 * RAG Query Node
 * Complete RAG pipeline: Query -> Embed -> Search -> Augment -> Generate
 */
export class RAGQueryNodeExecutor extends BaseNodeExecutor {
    type = 'rag-query';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            question,
            systemPrompt = 'Answer the question based on the provided context. If the context doesn\'t contain relevant information, say so.',
            topK = 5,
            model = 'gpt-4o-mini'
        } = node.data;

        const query = question || context.data.question || context.data.query || '';

        if (!query) {
            throw new Error('Question/query is required for RAG');
        }

        this.addLog(context, 'info', `RAG query: "${query.substring(0, 50)}..."`, node.id);

        // Use context from previous vector search if available
        const retrievedDocs = context.data.matches || context.data.documents || [];

        // Build context from retrieved documents
        const contextText = retrievedDocs
            .map((doc: any, i: number) => `[${i + 1}] ${doc.metadata?.text || doc.text || JSON.stringify(doc)}`)
            .join('\n\n');

        // Generate answer using LLM
        const apiKey = node.data.apiKey || process.env.OPENAI_API_KEY;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Context:\n${contextText}\n\nQuestion: ${query}` }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`LLM Error: ${await response.text()}`);
        }

        const data = await response.json();
        const answer = data.choices[0]?.message?.content || '';

        return {
            answer,
            question: query,
            sourcesCount: retrievedDocs.length,
            sources: retrievedDocs.slice(0, 3).map((d: any) => d.metadata || d),
            model
        };
    }
}
