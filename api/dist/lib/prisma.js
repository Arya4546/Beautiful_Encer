import { PrismaClient } from '@prisma/client';
// Singleton Prisma instance for dev & prod
export const prisma = global.prisma ??
    new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
if (process.env.NODE_ENV !== 'production')
    global.prisma = prisma;
