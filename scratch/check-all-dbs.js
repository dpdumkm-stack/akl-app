const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function checkDb(dbPath) {
  console.log(`\nChecking DB: ${dbPath}`);
  const absolutePath = path.resolve(dbPath);
  const prisma = new PrismaClient({
    datasources: {
      db: { url: `file:${absolutePath}` },
    },
  });
  
  try {
    const users = await prisma.user.findMany();
    console.log(users.map(u => {
      const { password, ...rest } = u;
      return rest;
    }));
  } catch (e) {
    console.log(`Error reading ${dbPath}: ${e.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await checkDb('./database.db');
  await checkDb('./prisma/database.db');
  await checkDb('./prisma/dev.db');
}

main();
