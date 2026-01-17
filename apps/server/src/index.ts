import 'dotenv/config';
import { WaveforAIServer } from './server';
import { initDb } from './db';
import { initQueue } from './queue';

const start = async () => {
    try {
        await initDb();
        initQueue();
        const server = new WaveforAIServer();
        await server.start();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

start();
// Force restart to load .env
