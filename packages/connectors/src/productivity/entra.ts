import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Entra ID (Azure AD) Node
 */
export class EntraIDNodeExecutor extends BaseNodeExecutor {
    type = 'entra-id';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const tenantId = node.data.tenantId || process.env.AZURE_TENANT_ID;
        const clientId = node.data.clientId || process.env.AZURE_CLIENT_ID;
        const clientSecret = node.data.clientSecret || process.env.AZURE_CLIENT_SECRET;
        const operation = node.data.operation || 'get-user';

        this.addLog(context, 'info', `EntraID: ${operation}`, node.id);

        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Azure credentials required');
        }

        try {
            // 1. Get Token
            const tokenParams = new URLSearchParams({
                client_id: clientId,
                scope: 'https://graph.microsoft.com/.default',
                client_secret: clientSecret,
                grant_type: 'client_credentials'
            });

            const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: tokenParams.toString()
            });

            if (!tokenRes.ok) throw new Error('Failed to get Azure token');
            const tokenData = await tokenRes.json();
            const accessToken = tokenData.access_token;

            // 2. Call Graph API
            const baseUrl = 'https://graph.microsoft.com/v1.0';
            let result;

            if (operation === 'get-user') {
                const email = node.data.email || context.data.email;
                const res = await fetch(`${baseUrl}/users/${email}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                if (!res.ok) throw new Error(await res.text());
                result = await res.json();
            } else {
                throw new Error('Only get-user supported currently');
            }

            return { success: true, data: result };

        } catch (error: any) {
            this.addLog(context, 'error', `EntraID Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
