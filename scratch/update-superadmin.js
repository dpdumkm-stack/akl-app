const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('qila2026', 10);
  const user = await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {
      password: hashedPassword,
      role: 'OWNER',
      name: 'Super Admin',
    },
    create: {
      username: 'superadmin',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'OWNER',
    },
  });
  console.log('User superadmin berhasil diperbarui menjadi OWNER dengan password baru.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
