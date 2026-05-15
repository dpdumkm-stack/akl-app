const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- RESTORING ADMIN ACCOUNTS ---');
  
  // 1. Superadmin
  const hashedSuper = await bcrypt.hash('qila2026', 10);
  const superadmin = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      password: hashedSuper,
      role: 'OWNER',
      name: 'Super Admin',
      isActive: true
    },
    create: {
      username: 'superadmin',
      password: hashedSuper,
      name: 'Super Admin',
      role: 'OWNER',
      isActive: true
    },
  });
  console.log('✅ Account restored: superadmin');

  // 2. Admin
  const hashedAdmin = await bcrypt.hash('password123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedAdmin,
      role: 'OWNER',
      name: 'Admin Utama',
      isActive: true
    },
    create: {
      username: 'admin',
      password: hashedAdmin,
      name: 'Admin Utama',
      role: 'OWNER',
      isActive: true
    },
  });
  console.log('✅ Account restored: admin');
}

main()
  .catch(e => {
    console.error('❌ Error restoring accounts:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
