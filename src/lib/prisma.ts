import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma客户端配置选项
const getPrismaClientOptions = () => {
  if (process.env.NODE_ENV === 'development') {
    return {
      log: [
        { emit: 'stdout' as const, level: 'query' as const },
        { emit: 'stdout' as const, level: 'error' as const },
        { emit: 'stdout' as const, level: 'warn' as const },
      ],
    };
  }
  return {
    log: [{ emit: 'stdout' as const, level: 'error' as const }],
  };
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(getPrismaClientOptions());

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// 优雅关闭连接
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
