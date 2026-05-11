const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("--- DAFTAR PENAWARAN (10 TERBARU) ---");
  const quotations = await prisma.quotation.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      nomorSurat: true,
      namaKlien: true,
      createdAt: true
    }
  });

  if (quotations.length === 0) {
    console.log("Belum ada data penawaran.");
  } else {
    quotations.forEach((q, i) => {
      console.log(`${i+1}. [${q.nomorSurat}] - ${q.namaKlien} (${new Date(q.createdAt).toLocaleDateString('id-ID')})`);
    });
  }

  console.log("\n--- DAFTAR INVOICE (10 TERBARU) ---");
  const invoices = await prisma.invoice.findMany({
    take: 10,
    orderBy: { date: 'desc' },
    select: {
      id: true,
      invoiceNumber: true,
      clientName: true,
      date: true
    }
  });

  if (invoices.length === 0) {
    console.log("Belum ada data invoice.");
  } else {
    invoices.forEach((inv, i) => {
      console.log(`${i+1}. [${inv.invoiceNumber}] - ${inv.clientName} (${new Date(inv.date).toLocaleDateString('id-ID')})`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
