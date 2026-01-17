import { PrismaClient } from '@waveforai/database';

export const db = new PrismaClient();

export const initDb = async () => {
  // Prisma manages connections automatically, but we can verify connection here
  try {
    await db.$connect();
    console.log('Connected to database via Prisma');
  } catch (err) {
    console.error('Failed to connect to database', err);
  }
};

export default db;
