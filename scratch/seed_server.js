const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding database server...');

  // 1. Tambahkan Global Settings jika belum ada
  const settings = [
    { id: 'LOGO', value: '' },
    { id: 'TTD', value: '' }
  ];

  for (const s of settings) {
    const existing = await prisma.globalSetting.findUnique({ where: { id: s.id } });
    if (!existing) {
        await prisma.globalSetting.create({ data: s });
        console.log(`✅ Setting ${s.id} dibuat.`);
    } else {
        console.log(`ℹ️ Setting ${s.id} sudah ada.`);
    }
  }

  // 2. Tambahkan User Admin default jika belum ada
  // Password yang di-hash (misal: 'admin123')
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'password_anda_disini', // Sebaiknya biarkan user yang ganti atau pakai hash
      name: 'Administrator'
    }
  });
  console.log('✅ User admin diinisialisasi.');

  console.log('🚀 Seeding selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
