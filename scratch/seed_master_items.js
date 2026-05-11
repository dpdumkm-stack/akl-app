const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = [
    {
      deskripsi: 'Pekerjaan Epoxy Coating 300 Micron',
      bahan: 'Bahan Epoxy Resin & Hardener (Standard Color)',
      satuan: 'm2',
      harga: 85000,
      hargaBahan: 55000,
      hargaJasa: 30000
    },
    {
      deskripsi: 'Pekerjaan Epoxy Self Leveling 1000 Micron',
      bahan: 'Bahan Epoxy Self Leveling High Quality',
      satuan: 'm2',
      harga: 165000,
      hargaBahan: 120000,
      hargaJasa: 45000
    },
    {
      deskripsi: 'Pekerjaan Epoxy Multilayer 1000 Micron',
      bahan: 'Bahan Epoxy Resin & Silica Sand',
      satuan: 'm2',
      harga: 145000,
      hargaBahan: 100000,
      hargaJasa: 45000
    },
    {
      deskripsi: 'Pekerjaan Water Proofing Polyurethane',
      bahan: 'Bahan PU Coating Waterproofing',
      satuan: 'm2',
      harga: 110000,
      hargaBahan: 75000,
      hargaJasa: 35000
    },
    {
      deskripsi: 'Pekerjaan Floor Hardener Non-Metallic',
      bahan: 'Bahan Floor Hardener Sika/Equivalent',
      satuan: 'm2',
      harga: 45000,
      hargaBahan: 25000,
      hargaJasa: 20000
    }
  ];

  console.log("Memulai penambahan item master...");
  
  for (const item of items) {
    await prisma.masterItem.upsert({
      where: { deskripsi: item.deskripsi },
      update: item,
      create: item
    });
    console.log(`- Berhasil: ${item.deskripsi}`);
  }

  console.log("\nProses selesai! 5 Item Master berhasil ditambahkan/diperbarui.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
