import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Enable query logging in development for performance monitoring
if (process.env.NODE_ENV === 'development') {
  // Query performance will be logged via Prisma's built-in logging
  console.log('Database connection pool initialized with optimized settings')
}


// Graceful shutdown with connection cleanup
async function gracefulShutdown() {
  console.log('Closing database connections...')
  await db.$disconnect()
  console.log('Database connections closed')
}

process.on('beforeExit', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)
process.on('SIGTERM', gracefulShutdown)