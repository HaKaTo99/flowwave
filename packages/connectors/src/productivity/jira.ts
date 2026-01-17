import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Jira Node
 * Interact with Jira Cloud REST API
 */
export class JiraNodeExecutor extends BaseNodeExecutor {
    type = 'jira';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const domain = node.data.domain || process.env.JIRA_DOMAIN; // mycompany.atlassian.net
        const email = node.data.email || process.env.JIRA_EMAIL;
        const apiToken = node.data.apiToken || process.env.JIRA_API_TOKEN;
        const operation = node.data.operation || 'create-issue';

        if (!domain || !email || !apiToken) throw new Error('Jira credentials required');

        const baseUrl = `https://${domain}/rest/api/3`;
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');

        this.addLog(context, 'info', `Jira: ${operation}`, node.id);

        try {
            if (operation === 'create-issue') {
                const projectKey = node.data.projectKey || 'PROJ';
                const summary = node.data.summary || context.data.summary || 'New Issue';

                const body = {
                    fields: {
                        project: { key: projectKey },
                        summary: summary,
                        issuetype: { name: 'Task' },
                        description: node.data.description ? {
                            type: 'doc',
                            version: 1,
                            content: [{ type: 'paragraph', content: [{ type: 'text', text: node.data.description }] }]
                        } : undefined
                    }
                };

                const response = await fetch(`${baseUrl}/issue`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) throw new Error(await response.text());
                const data = await response.json();
                return { key: data.key, id: data.id, self: data.self };
            }

            throw new Error(`Jira operation ${operation} not implemented`);

        } catch (error: any) {
            this.addLog(context, 'error', `Jira Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
