const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = [
    { deskripsi: "PENGADAAN MATERIAL", satuan: "Lot", harga: 0 },
    { deskripsi: "JASA PEMASANGAN", satuan: "m2", harga: 0 },
    { deskripsi: "MOBILISASI & ALAT", satuan: "Lot", harga: 0 }
  ];

  console.log("🌱 Seeding Master Items...");
  for (const item of items) {
    await prisma.masterItem.upsert({
      where: { deskripsi: item.deskripsi },
      update: {},
      create: item,
    });
  }
  console.log("✅ Done!");
}

main().finally(() => prisma.$disconnect());
