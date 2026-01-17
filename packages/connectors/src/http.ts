import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';
import axios from 'axios';

export class HttpNodeExecutor extends BaseNodeExecutor {
    type = 'http-request'; // Matches frontend node type

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const { url, method, body, headers } = node.data;

        if (!url) {
            if (process.env.SIMULATION_MODE === 'true') {
                this.addLog(context, 'warn', '[SIMULATION] No URL provided. Returning mock response.', node.id);
                return { status: 200, data: { status: 'mocked_success', message: 'Hello from Simulation Mode!' } };
            }
            throw new Error('URL is required');
        }

        try {
            const response = await axios({
                method: method || 'GET',
                url,
                data: body,
                headers: headers || {}
            });

            return {
                status: response.status,
                data: response.data,
                headers: response.headers
            };
        } catch (error: any) {
            if (error.response) {
                return {
                    status: error.response.status,
                    data: error.response.data,
                    error: error.message
                };
            }
            throw error;
        }
    }
}
