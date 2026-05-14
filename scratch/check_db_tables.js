const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function check() {
  const dbPath = path.join(process.cwd(), 'database.db');
  console.log('Checking database at:', dbPath);
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: `file:${dbPath}` },
    },
  });

  try {
    const count = await prisma.quotation.count();
    console.log('Success! Quotation count:', count);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
