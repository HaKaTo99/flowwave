import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Notion Node
 * Interact with Notion databases and pages
 */
export class NotionNodeExecutor extends BaseNodeExecutor {
    type = 'notion';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const apiKey = node.data.apiKey || process.env.NOTION_API_KEY;
        const operation = node.data.operation || 'query'; // 'query' | 'create' | 'update'
        const databaseId = node.data.databaseId;
        const pageId = node.data.pageId;

        if (!apiKey) {
            throw new Error('Notion API Key is required');
        }

        this.addLog(context, 'info', `Notion ${operation}`, node.id);

        const headers = {
            'Authorization': `Bearer ${apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        };

        try {
            let url: string;
            let method: string;
            let body: any;

            switch (operation) {
                case 'query':
                    url = `https://api.notion.com/v1/databases/${databaseId}/query`;
                    method = 'POST';
                    body = node.data.filter ? { filter: node.data.filter } : {};
                    break;

                case 'create':
                    url = 'https://api.notion.com/v1/pages';
                    method = 'POST';
                    body = {
                        parent: { database_id: databaseId },
                        properties: node.data.properties || context.data.properties || {}
                    };
                    break;

                case 'update':
                    url = `https://api.notion.com/v1/pages/${pageId}`;
                    method = 'PATCH';
                    body = {
                        properties: node.data.properties || context.data.properties || {}
                    };
                    break;

                case 'getPage':
                    url = `https://api.notion.com/v1/pages/${pageId}`;
                    method = 'GET';
                    break;

                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            const response = await fetch(url, {
                method,
                headers,
                body: method !== 'GET' ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Notion Error: ${error.message || response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                operation,
                data,
                results: data.results || [data]
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Notion Error: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * Google Sheets Node
 * Read and write to Google Sheets
 */
export class GoogleSheetsNodeExecutor extends BaseNodeExecutor {
    type = 'google-sheets';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const apiKey = node.data.apiKey || process.env.GOOGLE_API_KEY;
        const spreadsheetId = node.data.spreadsheetId;
        const range = node.data.range || 'Sheet1!A1:Z1000';
        const operation = node.data.operation || 'read'; // 'read' | 'append' | 'update'

        if (!apiKey || !spreadsheetId) {
            throw new Error('Google API Key and Spreadsheet ID are required');
        }

        this.addLog(context, 'info', `Google Sheets ${operation} on ${range}`, node.id);

        const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;

        try {
            let url: string;
            let method: string;
            let body: any;

            switch (operation) {
                case 'read':
                    url = `${baseUrl}/values/${encodeURIComponent(range)}?key=${apiKey}`;
                    method = 'GET';
                    break;

                case 'append':
                    url = `${baseUrl}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&key=${apiKey}`;
                    method = 'POST';
                    body = {
                        values: node.data.values || context.data.values || []
                    };
                    break;

                case 'update':
                    url = `${baseUrl}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED&key=${apiKey}`;
                    method = 'PUT';
                    body = {
                        values: node.data.values || context.data.values || []
                    };
                    break;

                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Google Sheets Error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                operation,
                range,
                values: data.values || [],
                updatedRows: data.updates?.updatedRows
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Google Sheets Error: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * Airtable Node
 */
export class AirtableNodeExecutor extends BaseNodeExecutor {
    type = 'airtable';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const apiKey = node.data.apiKey || process.env.AIRTABLE_API_KEY;
        const baseId = node.data.baseId;
        const tableName = node.data.tableName;
        const operation = node.data.operation || 'list'; // 'list' | 'create' | 'update' | 'delete'

        if (!apiKey || !baseId || !tableName) {
            throw new Error('Airtable API Key, Base ID, and Table Name are required');
        }

        this.addLog(context, 'info', `Airtable ${operation} on ${tableName}`, node.id);

        const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

        try {
            let url = baseUrl;
            let method = 'GET';
            let body: any;

            switch (operation) {
                case 'list':
                    if (node.data.filterByFormula) {
                        url += `?filterByFormula=${encodeURIComponent(node.data.filterByFormula)}`;
                    }
                    break;

                case 'create':
                    method = 'POST';
                    body = {
                        records: Array.isArray(node.data.records)
                            ? node.data.records
                            : [{ fields: node.data.fields || context.data }]
                    };
                    break;

                case 'update':
                    method = 'PATCH';
                    body = {
                        records: node.data.records || [{
                            id: node.data.recordId,
                            fields: node.data.fields || context.data
                        }]
                    };
                    break;

                case 'delete':
                    method = 'DELETE';
                    url += `?records[]=${node.data.recordId}`;
                    break;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Airtable Error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                operation,
                records: data.records || [],
                count: data.records?.length || 0
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Airtable Error: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * GitHub Node
 */
export class GitHubNodeExecutor extends BaseNodeExecutor {
    type = 'github';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const token = node.data.token || process.env.GITHUB_TOKEN;
        const owner = node.data.owner;
        const repo = node.data.repo;
        const operation = node.data.operation || 'getRepo';

        if (!token) {
            throw new Error('GitHub Token is required');
        }

        this.addLog(context, 'info', `GitHub ${operation}`, node.id);

        const headers = {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };

        try {
            let url = 'https://api.github.com';
            let method = 'GET';
            let body: any;

            switch (operation) {
                case 'getRepo':
                    url += `/repos/${owner}/${repo}`;
                    break;

                case 'listIssues':
                    url += `/repos/${owner}/${repo}/issues`;
                    break;

                case 'createIssue':
                    url += `/repos/${owner}/${repo}/issues`;
                    method = 'POST';
                    body = {
                        title: node.data.title || context.data.title,
                        body: node.data.body || context.data.body
                    };
                    break;

                case 'createPR':
                    url += `/repos/${owner}/${repo}/pulls`;
                    method = 'POST';
                    body = {
                        title: node.data.title,
                        head: node.data.head,
                        base: node.data.base || 'main',
                        body: node.data.body
                    };
                    break;

                default:
                    throw new Error(`Unknown operation: ${operation}`);
            }

            const response = await fetch(url, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`GitHub Error: ${error.message || response.statusText}`);
            }

            const data = await response.json();

            return {
                success: true,
                operation,
                data
            };
        } catch (error: any) {
            this.addLog(context, 'error', `GitHub Error: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * Google Docs Node
 * Read content from Google Docs
 */
export class GoogleDocsNodeExecutor extends BaseNodeExecutor {
    type = 'google-docs';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const apiKey = node.data.apiKey || process.env.GOOGLE_API_KEY;
        const documentId = node.data.documentId;
        const operation = node.data.operation || 'read'; // 'read'

        if (!apiKey || !documentId) {
            throw new Error('Google API Key and Document ID are required');
        }

        this.addLog(context, 'info', `Google Docs ${operation} on ${documentId}`, node.id);

        try {
            let content = '';

            // Fetch document structure
            const url = `https://docs.googleapis.com/v1/documents/${documentId}?key=${apiKey}`;
            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Google Docs Error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // Simple text extractor from Docs JSON structure
            if (data.body && data.body.content) {
                content = data.body.content
                    .map((element: any) => {
                        if (element.paragraph) {
                            return element.paragraph.elements
                                .map((ele: any) => ele.textRun?.content || '')
                                .join('');
                        }
                        return '';
                    })
                    .join('\n');
            }

            return {
                success: true,
                operation,
                documentId,
                title: data.title,
                content: content.trim(),
                raw: data
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Google Docs Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
