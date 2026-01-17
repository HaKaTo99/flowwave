import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';
import crypto from 'crypto';

export interface WebhookConfig {
    id: string;
    workflowId: string;
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    secretKey: string;
    isActive: boolean;
    createdAt: Date;
}

/**
 * Webhook Trigger Node
 * Generates a unique webhook URL that can trigger workflow execution
 */
export class WebhookNodeExecutor extends BaseNodeExecutor {
    type = 'webhook';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            webhookId,
            method = 'POST',
            responseMode = 'lastNode',
            responseData = null
        } = node.data;

        // If this is a webhook trigger, the data should already be in context
        const webhookData = context.data.webhookPayload || {};

        this.addLog(
            context,
            'info',
            `Webhook received: ${method} request with ${JSON.stringify(webhookData).length} bytes`,
            node.id
        );

        return {
            webhookId,
            method,
            payload: webhookData,
            headers: context.data.webhookHeaders || {},
            query: context.data.webhookQuery || {},
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate a unique webhook URL path
     */
    static generateWebhookPath(): string {
        return crypto.randomBytes(16).toString('hex');
    }

    /**
     * Generate a secret key for HMAC signature verification
     */
    static generateSecretKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    /**
     * Verify webhook signature
     */
    static verifySignature(payload: string, signature: string, secretKey: string): boolean {
        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    /**
     * Create signature for webhook payload
     */
    static createSignature(payload: string, secretKey: string): string {
        return crypto
            .createHmac('sha256', secretKey)
            .update(payload)
            .digest('hex');
    }
}

/**
 * HTTP Response Node
 * Defines the response to send back to webhook caller
 */
export class WebhookResponseNodeExecutor extends BaseNodeExecutor {
    type = 'webhook-response';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            statusCode = 200,
            body = { success: true },
            headers = {}
        } = node.data;

        // Store response in context for webhook handler to use
        const response = {
            statusCode,
            body: typeof body === 'string' ? body : JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        this.addLog(
            context,
            'info',
            `Webhook response prepared: ${statusCode}`,
            node.id
        );

        return {
            webhookResponse: response,
            responded: true
        };
    }
}
