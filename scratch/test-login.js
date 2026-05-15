const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function testLogin(username, password) {
  console.log(`\nTesting login for: ${username}`);
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (isValid) {
      console.log('✅ Password VALID');
      console.log('Role:', user.role);
    } else {
      console.log('❌ Password INVALID');
    }
  } catch (e) {
    console.error('Error:', e);
  }
}

async function main() {
  await testLogin('superadmin', 'qila2026');
  await testLogin('admin', 'password123');
  await prisma.$disconnect();
}

main();
