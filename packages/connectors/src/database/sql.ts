import { BaseNodeExecutor, WorkflowNode, ExecutionContext } from '@waveforai/core-engine';

/**
 * Postgres Node
 * Execute SQL queries on PostgreSQL databases
 */
export class PostgresNodeExecutor extends BaseNodeExecutor {
    type = 'postgres';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            host = 'localhost',
            port = 5432,
            database,
            user,
            password,
            query,
            operation = 'query' // 'query' | 'insert' | 'update' | 'delete'
        } = node.data;

        if (!database || !query) {
            throw new Error('Database name and query are required');
        }

        this.addLog(context, 'info', `Executing ${operation} on Postgres`, node.id);

        // In production, you would use pg (node-postgres)
        // const { Pool } = require('pg');
        // const pool = new Pool({ host, port, database, user, password });
        // const result = await pool.query(query);

        // Simulated response for now
        return {
            success: true,
            operation,
            query,
            rowCount: 0,
            rows: [],
            message: 'PostgreSQL execution simulated (install pg package for real queries)'
        };
    }
}

/**
 * MySQL Node
 */
export class MySQLNodeExecutor extends BaseNodeExecutor {
    type = 'mysql';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            host = 'localhost',
            port = 3306,
            database,
            user,
            password,
            query
        } = node.data;

        if (!database || !query) {
            throw new Error('Database name and query are required');
        }

        this.addLog(context, 'info', 'Executing MySQL query', node.id);

        // In production, use mysql2
        // const mysql = require('mysql2/promise');
        // const connection = await mysql.createConnection({ host, port, user, password, database });
        // const [rows] = await connection.execute(query);

        return {
            success: true,
            query,
            rows: [],
            message: 'MySQL execution simulated (install mysql2 package for real queries)'
        };
    }
}

/**
 * MongoDB Node
 */
export class MongoDBNodeExecutor extends BaseNodeExecutor {
    type = 'mongodb';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const {
            connectionString,
            database,
            collection,
            operation = 'find', // 'find' | 'insertOne' | 'updateOne' | 'deleteOne'
            query = {},
            data
        } = node.data;

        if (!connectionString || !database || !collection) {
            throw new Error('Connection string, database, and collection are required');
        }

        this.addLog(context, 'info', `MongoDB ${operation} on ${collection}`, node.id);

        // In production, use mongodb
        // const { MongoClient } = require('mongodb');
        // const client = new MongoClient(connectionString);
        // const db = client.db(database);
        // const coll = db.collection(collection);

        return {
            success: true,
            operation,
            collection,
            documents: [],
            message: 'MongoDB execution simulated (install mongodb package for real queries)'
        };
    }
}

/**
 * Supabase Node
 * Interact with Supabase database and auth
 */
export class SupabaseNodeExecutor extends BaseNodeExecutor {
    type = 'supabase';

    async execute(node: WorkflowNode, context: ExecutionContext): Promise<Record<string, any>> {
        const supabaseUrl = node.data.supabaseUrl || process.env.SUPABASE_URL;
        const supabaseKey = node.data.supabaseKey || process.env.SUPABASE_ANON_KEY;
        const table = node.data.table;
        const operation = node.data.operation || 'select'; // 'select' | 'insert' | 'update' | 'delete'

        if (!supabaseUrl || !supabaseKey || !table) {
            throw new Error('Supabase URL, key, and table are required');
        }

        this.addLog(context, 'info', `Supabase ${operation} on ${table}`, node.id);

        try {
            let url = `${supabaseUrl}/rest/v1/${table}`;
            let method = 'GET';
            let body: string | undefined;

            switch (operation) {
                case 'insert':
                    method = 'POST';
                    body = JSON.stringify(node.data.data || context.data);
                    break;
                case 'update':
                    method = 'PATCH';
                    url += `?${node.data.filter || 'id=eq.1'}`;
                    body = JSON.stringify(node.data.data || context.data);
                    break;
                case 'delete':
                    method = 'DELETE';
                    url += `?${node.data.filter || 'id=eq.1'}`;
                    break;
                case 'select':
                default:
                    if (node.data.filter) {
                        url += `?${node.data.filter}`;
                    }
                    break;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Supabase Error: ${error}`);
            }

            const data = await response.json();

            return {
                success: true,
                operation,
                table,
                data,
                count: Array.isArray(data) ? data.length : 1
            };
        } catch (error: any) {
            this.addLog(context, 'error', `Supabase Error: ${error.message}`, node.id);
            throw error;
        }
    }
}
