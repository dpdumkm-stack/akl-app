const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const year = new Date().getFullYear();
  
  // Update atau buat sequence INVOICE tahun ini ke angka 3
  const seq = await prisma.documentSequence.upsert({
    where: { 
      type_year: { type: 'INVOICE', year } 
    },
    update: { 
      lastUrut: 3 
    },
    create: { 
      type: 'INVOICE', 
      year, 
      lastUrut: 3 
    },
  });
  
  console.log('Sequence INVOICE updated to:', seq.lastUrut);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
