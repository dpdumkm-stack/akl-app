const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany();
  console.log('--- DAFTAR KLIEN DI DATABASE ---');
  console.log(JSON.stringify(clients, null, 2));
  console.log('-------------------------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());
