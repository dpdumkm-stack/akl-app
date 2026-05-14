const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Mengecek Database AKL...");
  try {
    const settings = await prisma.globalSetting.findMany();
    console.log("✅ Global Settings:", settings);

    const signatories = await prisma.penandatangan.findMany();
    console.log("✅ Database Penandatangan:", signatories.length, "entri");
    
    if (signatories.length > 0) {
      console.log("Contoh Penandatangan:", signatories[0].nama);
    }
  } catch (error) {
    console.error("❌ Error saat cek database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
