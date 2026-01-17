import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Proxmox Node
 * Manage VMs via Proxmox VE API
 */
export class ProxmoxNodeExecutor extends BaseNodeExecutor {
    type = 'proxmox';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const host = node.data.host || process.env.PROXMOX_HOST; // https://192.168.1.100:8006
        const token = node.data.token || process.env.PROXMOX_TOKEN; // user@pam!token=uuid
        const nodeId = node.data.node || 'pve';
        const vmid = node.data.vmid || context.data.vmid;
        const operation = node.data.operation || 'status'; // status, start, stop

        if (!host || !token) throw new Error('Proxmox Host and Token required');

        // Proxmox uses self-signed certs often, we might need to ignore SSL
        // But fetch doesn't support 'rejectUnauthorized: false' easily in standard envs without agent
        // Assuming valid cert or properly configured env

        this.addLog(context, 'info', `Proxmox: ${operation} on VM ${vmid}`, node.id);

        const headers = {
            'Authorization': `PVEAPIToken=${token}`,
            'Content-Type': 'application/json'
        };

        try {
            if (operation === 'status') {
                const res = await fetch(`${host}/api2/json/nodes/${nodeId}/qemu/${vmid}/status/current`, { headers });
                if (!res.ok) throw new Error(await res.text());
                const data = await res.json();
                return { status: data.data.status, uptime: data.data.uptime };
            }

            return { message: 'Only status check implemented for safety' };

        } catch (error: any) {
            this.addLog(context, 'error', `Proxmox Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
