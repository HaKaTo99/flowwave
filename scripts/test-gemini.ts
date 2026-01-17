
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env from apps/server
dotenv.config({ path: path.join(__dirname, '../apps/server/.env') });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error('No GOOGLE_API_KEY found in apps/server/.env');
    process.exit(1);
}

console.log('Using API Key:', apiKey.substring(0, 5) + '...');

async function listModels() {
    const genAI = new GoogleGenerativeAI(apiKey!);

    // Explicit list of models to test
    const candidates = [
        'gemini-pro',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest'
    ];

    console.log('\n--- SCANNING AVAILABLE MODELS ---');
    for (const model of candidates) {
        process.stdout.write(`Testing: ${model.padEnd(25)} ... `);
        try {
            const m = genAI.getGenerativeModel({ model });
            const result = await m.generateContent('Say OK');
            const response = await result.response;
            console.log(`✅ SUCCESS`);
        } catch (e: any) {
            const msg = e.message || 'Unknown Error';
            if (msg.includes('404')) console.log(`❌ FAILED (404 Not Found)`);
            else console.log(`❌ FAILED (${msg.split('\n')[0].substring(0, 50)}...)`);
        }
    }
    console.log('--- END SCAN ---');
}

listModels();
