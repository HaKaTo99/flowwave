import { WorkflowNode, ExecutionContext, ExecutionLog } from './types';

export interface RetryConfig {
    maxRetries: number;
    initialDelay: number;
    maxDelay: number;
    backoffMultiplier: number;
    retryableErrors?: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2
};

/**
 * Retry Manager
 * Handles automatic retries with exponential backoff
 */
export class RetryManager {
    private config: RetryConfig;

    constructor(config: Partial<RetryConfig> = {}) {
        this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    }

    /**
     * Execute a function with retry logic
     */
    async executeWithRetry<T>(
        fn: () => Promise<T>,
        context: ExecutionContext,
        nodeId: string,
        customConfig?: Partial<RetryConfig>
    ): Promise<T> {
        const config = { ...this.config, ...customConfig };
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                const result = await fn();

                if (attempt > 0) {
                    this.addLog(context, 'info',
                        `Success after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`,
                        nodeId
                    );
                }

                return result;
            } catch (error: any) {
                lastError = error;

                // Check if error is retryable
                if (!this.isRetryable(error, config.retryableErrors)) {
                    this.addLog(context, 'error',
                        `Non-retryable error: ${error.message}`,
                        nodeId
                    );
                    throw error;
                }

                if (attempt < config.maxRetries) {
                    const delay = this.calculateDelay(attempt, config);

                    this.addLog(context, 'warn',
                        `Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`,
                        nodeId
                    );

                    await this.delay(delay);
                } else {
                    this.addLog(context, 'error',
                        `All ${config.maxRetries} retries exhausted. Final error: ${error.message}`,
                        nodeId
                    );
                }
            }
        }

        throw lastError;
    }

    /**
     * Calculate delay with exponential backoff and jitter
     */
    private calculateDelay(attempt: number, config: RetryConfig): number {
        const exponentialDelay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
        const jitter = Math.random() * config.initialDelay;
        const delay = exponentialDelay + jitter;

        return Math.min(delay, config.maxDelay);
    }

    /**
     * Check if an error is retryable
     */
    private isRetryable(error: Error, retryablePatterns?: string[]): boolean {
        // Default retryable errors
        const defaultRetryable = [
            'ETIMEDOUT',
            'ECONNRESET',
            'ECONNREFUSED',
            'ENOTFOUND',
            'rate limit',
            'timeout',
            '429',
            '502',
            '503',
            '504'
        ];

        const patterns = retryablePatterns || defaultRetryable;
        const errorString = `${error.name} ${error.message}`.toLowerCase();

        return patterns.some(pattern =>
            errorString.includes(pattern.toLowerCase())
        );
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private addLog(
        context: ExecutionContext,
        level: 'info' | 'warn' | 'error',
        message: string,
        nodeId: string
    ): void {
        context.logs.push({
            timestamp: new Date(),
            level,
            message: `[Retry] ${message}`,
            nodeId
        });
    }
}

/**
 * Error Handler
 * Manage workflow-level error handling
 */
export class ErrorHandler {
    async handleNodeError(
        error: Error,
        node: WorkflowNode,
        context: ExecutionContext,
        options: {
            continueOnError?: boolean;
            fallbackValue?: any;
            onError?: (error: Error) => Promise<void>;
        } = {}
    ): Promise<any> {
        const { continueOnError = false, fallbackValue = null, onError } = options;

        // Log the error
        context.logs.push({
            timestamp: new Date(),
            level: 'error',
            message: `Node ${node.id} (${node.type}) failed: ${error.message}`,
            nodeId: node.id,
            data: {
                errorName: error.name,
                errorStack: error.stack
            }
        });

        // Call custom error handler if provided
        if (onError) {
            await onError(error);
        }

        // If continue on error, return fallback value
        if (continueOnError) {
            context.logs.push({
                timestamp: new Date(),
                level: 'warn',
                message: `Continuing with fallback value for node ${node.id}`,
                nodeId: node.id
            });
            return fallbackValue;
        }

        // Re-throw to stop workflow execution
        throw error;
    }
}

// Export singleton instances
export const retryManager = new RetryManager();
export const errorHandler = new ErrorHandler();
