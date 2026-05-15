const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const seqs = await prisma.documentSequence.findMany();
  console.log(JSON.stringify(seqs, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
