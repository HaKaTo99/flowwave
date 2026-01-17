import { Queue, Worker } from 'bullmq';
import { executeWorkflow } from './engine';

// Use a mock connection or conditional redis based on mode
// For pure offline MVP without Redis, we might need a distinct simple queue
// But since the plan mentioned BullMQ in-memory (which usually requires a mock Redis),
// we will start with a basic setup.
// Note: BullMQ requires Redis. For true offline no-dependency, we might need a simpler in-memory queue.
// However, the instructions say "BullMQ (in-memory for offline)".
// We can use IORedis-mock or similar, or just a simple array for MVP if Redis is absent.

// Let's implement a simple wrapper that uses BullMQ if REDIS_URL is present, or a local array if not.

interface Job {
    id: string;
    data: any;
}

class LocalQueue {
    private jobs: Job[] = [];
    private processor: (job: Job) => Promise<void>;

    constructor(name: string, processor?: any) {
        this.processor = processor;
    }

    async add(name: string, data: any) {
        const job = { id: Math.random().toString(36).substring(7), data };
        this.jobs.push(job);
        console.log(`[LocalQueue] Added job ${job.id}`);
        if (this.processor) {
            // simulate async processing
            setTimeout(() => this.process(job), 100);
        }
    }

    async process(job: Job) {
        console.log(`[LocalQueue] Processing job ${job.id}`);
        try {
            await this.processor(job);
            console.log(`[LocalQueue] Job ${job.id} completed`);
        } catch (err) {
            console.error(`[LocalQueue] Job ${job.id} failed`, err);
        }
    }
}

let workflowQueue: any;

export const initQueue = () => {
    // For now, defaulting to LocalQueue for Offline MVP ease
    console.log('Initializing Queue System (Offline Mode)');
    workflowQueue = new LocalQueue('workflow-queue', async (job: any) => {
        console.log('Worker picking up job:', job.id);
        await executeWorkflow(job.data.workflowId);
    });
};

export const addWorkflowJob = async (workflowId: string) => {
    await workflowQueue.add('execute-workflow', { workflowId });
};
