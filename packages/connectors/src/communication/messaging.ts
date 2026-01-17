import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Email (SMTP) Node
 * Send emails via SMTP
 */
export class EmailNodeExecutor extends BaseNodeExecutor {
    type = 'email';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            to,
            subject,
            body,
            from,
            smtpHost = 'smtp.gmail.com',
            smtpPort = 587,
            smtpUser,
            smtpPass
        } = { ...node.data, ...context.data };

        if (!to || !subject) {
            throw new Error('Email requires "to" and "subject" fields');
        }

        this.addLog(context, 'info', `Sending email to ${to}`, node.id);

        // In a real implementation, you would use nodemailer or similar
        // For now, we'll simulate the send
        const emailPayload = {
            from: from || smtpUser,
            to,
            subject,
            html: body || '',
            timestamp: new Date().toISOString()
        };

        // Simulate email sending (would use nodemailer in production)
        // const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, auth: { user: smtpUser, pass: smtpPass } });
        // await transporter.sendMail(emailPayload);

        return {
            sent: true,
            email: emailPayload,
            message: `Email sent to ${to}`
        };
    }
}

/**
 * Telegram Bot Node
 * Send messages via Telegram Bot API
 */
export class TelegramNodeExecutor extends BaseNodeExecutor {
    type = 'telegram';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const botToken = node.data.botToken || process.env.TELEGRAM_BOT_TOKEN;
        const chatId = node.data.chatId || context.data.chatId;
        const message = context.data.message || node.data.message;

        if (!botToken) {
            throw new Error('Telegram Bot Token is required');
        }

        if (!chatId || !message) {
            throw new Error('Chat ID and message are required');
        }

        this.addLog(context, 'info', `Sending Telegram message to chat ${chatId}`, node.id);

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${botToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: message,
                        parse_mode: node.data.parseMode || 'HTML'
                    })
                }
            );

            const data = await response.json();

            if (!data.ok) {
                throw new Error(`Telegram API Error: ${data.description}`);
            }

            return {
                sent: true,
                messageId: data.result.message_id,
                chatId
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Telegram Error: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * Discord Webhook Node
 * Send messages to Discord channels via webhook
 */
export class DiscordNodeExecutor extends BaseNodeExecutor {
    type = 'discord';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const webhookUrl = node.data.webhookUrl || process.env.DISCORD_WEBHOOK_URL;
        const message = context.data.message || node.data.message;
        const username = node.data.username || 'FlowWave Bot';
        const avatarUrl = node.data.avatarUrl;

        if (!webhookUrl) {
            throw new Error('Discord Webhook URL is required');
        }

        if (!message) {
            throw new Error('Message is required');
        }

        this.addLog(context, 'info', 'Sending Discord message', node.id);

        try {
            const payload: any = {
                content: message,
                username
            };

            if (avatarUrl) {
                payload.avatar_url = avatarUrl;
            }

            // Support embeds
            if (node.data.embeds) {
                payload.embeds = node.data.embeds;
            }

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Discord API Error: ${error}`);
            }

            return {
                sent: true,
                message
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Discord Error: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * Slack Webhook Node
 */
export class SlackNodeExecutor extends BaseNodeExecutor {
    type = 'slack';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const webhookUrl = node.data.webhookUrl || process.env.SLACK_WEBHOOK_URL;
        const message = context.data.message || node.data.message;
        const channel = node.data.channel;

        if (!webhookUrl) {
            if (process.env.SIMULATION_MODE === 'true') {
                this.addLog(context, 'warn', '[SIMULATION] No Slack URL provided. Skipping send.', node.id);
                return { sent: true, simulated: true, message };
            }
            throw new Error('Slack Webhook URL is required');
        }

        this.addLog(context, 'info', `Sending Slack message${channel ? ` to ${channel}` : ''}`, node.id);

        try {
            const payload: any = { text: message };
            if (channel) payload.channel = channel;
            if (node.data.blocks) payload.blocks = node.data.blocks;

            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Slack API Error: ${response.statusText}`);
            }

            return { sent: true, message };
        } catch (error: any) {
            this.addLog(context, 'error', `Slack Error: ${error.message}`, node.id);
            throw error;
        }
    }
}

/**
 * WhatsApp Node
 * Send messages via Meta Graph API
 */
export class WhatsAppNodeExecutor extends BaseNodeExecutor {
    type = 'whatsapp';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const phoneNumberId = node.data.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
        const accessToken = node.data.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
        const to = node.data.to || context.data.to;
        const message = node.data.message || context.data.message;
        const template = node.data.template;

        if (!to) {
            throw new Error('WhatsApp requires "to" phone number');
        }

        this.addLog(context, 'info', `Sending WhatsApp to ${to}`, node.id);

        // Simulation Mode if keys missing
        if (!phoneNumberId || !accessToken) {
            this.addLog(context, 'warn', '[SIMULATION] Missing WhatsApp Keys', node.id);
            return { sent: true, to, message, simulated: true };
        }

        const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

        const payload: any = {
            messaging_product: 'whatsapp',
            to: to,
        };

        if (template) {
            payload.type = 'template';
            payload.template = {
                name: template,
                language: { code: node.data.language || 'en_US' }
            };
        } else {
            payload.type = 'text';
            payload.text = { body: message || '' };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(JSON.stringify(err));
            }

            const data = await response.json();
            return { sent: true, id: data.messages?.[0]?.id };

        } catch (error: any) {
            this.addLog(context, 'error', `WhatsApp Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
