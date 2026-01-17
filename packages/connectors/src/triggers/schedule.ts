import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Schedule Node
 * Trigger workflows on a schedule (cron, interval, or one-time)
 */
export class ScheduleNodeExecutor extends BaseNodeExecutor {
    type = 'schedule';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            scheduleType = 'interval', // 'once' | 'interval' | 'cron'
            datetime,
            intervalSeconds = 60,
            cronExpression = '0 * * * *', // Every hour
            timezone = 'UTC',
            enabled = true
        } = node.data;

        if (!enabled) {
            this.addLog(context, 'info', 'Schedule is disabled', node.id);
            return { scheduled: false, reason: 'Schedule is disabled' };
        }

        const scheduleId = `schedule-${context.workflowId}-${node.id}`;

        this.addLog(context, 'info', `Creating ${scheduleType} schedule`, node.id);

        let nextRun: Date;
        let schedule: any;

        switch (scheduleType) {
            case 'once':
                if (!datetime) {
                    throw new Error('DateTime is required for one-time schedule');
                }
                nextRun = new Date(datetime);
                schedule = {
                    type: 'once',
                    runAt: nextRun.toISOString()
                };
                break;

            case 'interval':
                nextRun = new Date(Date.now() + intervalSeconds * 1000);
                schedule = {
                    type: 'interval',
                    every: intervalSeconds,
                    unit: 'seconds'
                };
                break;

            case 'cron':
                // Parse cron expression to get next run
                nextRun = this.getNextCronRun(cronExpression, timezone);
                schedule = {
                    type: 'cron',
                    expression: cronExpression,
                    timezone
                };
                break;

            default:
                throw new Error(`Unknown schedule type: ${scheduleType}`);
        }

        return {
            scheduleId,
            scheduled: true,
            scheduleType,
            schedule,
            nextRun: nextRun.toISOString(),
            timezone,
            message: `Workflow scheduled to run ${scheduleType === 'once' ? 'once' : 'repeatedly'}`
        };
    }

    private getNextCronRun(expression: string, timezone: string): Date {
        // Simplified cron parsing - in production use cron-parser
        // For now, just return next minute
        const now = new Date();
        now.setSeconds(0);
        now.setMilliseconds(0);
        now.setMinutes(now.getMinutes() + 1);
        return now;
    }
}

/**
 * Cron Trigger Node
 * Wrapper for schedule with friendly cron presets
 */
export class CronTriggerNodeExecutor extends BaseNodeExecutor {
    type = 'cron-trigger';

    private presets: Record<string, string> = {
        'every-minute': '* * * * *',
        'every-5-minutes': '*/5 * * * *',
        'every-15-minutes': '*/15 * * * *',
        'every-hour': '0 * * * *',
        'every-day-9am': '0 9 * * *',
        'every-monday-9am': '0 9 * * 1',
        'every-month-1st': '0 0 1 * *'
    };

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const { preset, customCron, timezone = 'Asia/Jakarta' } = node.data;

        const cronExpression = preset && preset !== 'custom'
            ? this.presets[preset]
            : customCron;

        if (!cronExpression) {
            throw new Error('Cron expression is required');
        }

        this.addLog(context, 'info', `Cron trigger: ${cronExpression}`, node.id);

        return {
            triggered: true,
            cronExpression,
            timezone,
            timestamp: new Date().toISOString(),
            presetUsed: preset || 'custom'
        };
    }
}

/**
 * Interval Trigger Node
 * Simple interval-based trigger
 */
export class IntervalTriggerNodeExecutor extends BaseNodeExecutor {
    type = 'interval-trigger';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            value = 1,
            unit = 'minutes' // 'seconds' | 'minutes' | 'hours' | 'days'
        } = node.data;

        const multipliers: Record<string, number> = {
            seconds: 1,
            minutes: 60,
            hours: 3600,
            days: 86400
        };

        const intervalSeconds = value * (multipliers[unit] || 60);

        this.addLog(context, 'info', `Interval: every ${value} ${unit}`, node.id);

        return {
            triggered: true,
            interval: {
                value,
                unit,
                seconds: intervalSeconds
            },
            timestamp: new Date().toISOString()
        };
    }
}
