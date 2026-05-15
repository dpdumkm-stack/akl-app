const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoices = await prisma.invoice.findMany({
    select: {
      id: true,
      invoiceNumber: true,
      nomorUrut: true,
      createdAt: true
    },
    orderBy: { nomorUrut: 'desc' }
  });
  console.log(JSON.stringify(invoices, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
