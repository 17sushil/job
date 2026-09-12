import { prisma } from '../database/client.js';

export const database = {
  async connect() {
    await prisma.$connect();
    console.log('PostgreSQL database connected via Prisma');
  },
  async disconnect() {
    await prisma.$disconnect();
    console.log('PostgreSQL database disconnected');
  },
};

