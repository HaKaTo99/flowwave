import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

// Global in-memory validation store (reset on server restart)
const memoryStore: Record<string, any[]> = {};

/**
 * Postgres Memory Node
 * Simulates a DB using in-memory arrays for testing workflows without real DB.
 */
export class PostgresMemoryNodeExecutor extends BaseNodeExecutor {
    type = 'postgres-memory';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const table = node.data.table || 'default';
        const operation = node.data.operation || 'select'; // select, insert, update
        const data = node.data.data || context.data;

        this.addLog(context, 'info', `MemoryDB: ${operation} on table '${table}'`, node.id);

        if (!memoryStore[table]) {
            memoryStore[table] = [];
        }

        switch (operation) {
            case 'insert':
                const record = { id: Date.now(), ...data };
                memoryStore[table].push(record);
                return { success: true, inserted: record, count: memoryStore[table].length };

            case 'select':
                // Simple filter (if data has filter object)
                let results = memoryStore[table];
                if (node.data.filter) {
                    // Primitive filter implementation
                    const [key, val] = node.data.filter.split('=');
                    if (key && val) {
                        results = results.filter(r => String(r[key.trim()]) === String(val.trim()));
                    }
                }
                return { rows: results, count: results.length };

            case 'update':
                // Not implemented for simple memory
                return { success: false, message: 'Update not supported in MemoryDB' };

            default:
                throw new Error(`Unknown operation ${operation}`);
        }
    }
}
