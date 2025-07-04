const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db'
    }
  }
});

// Handle graceful shutdown
process.on('beforeExit', async () => {
  console.log('🔌 Disconnecting from database...');
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  console.log('🔌 Received SIGINT, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Received SIGTERM, disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

// Test database connection
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected successfully');
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });

module.exports = prisma;
