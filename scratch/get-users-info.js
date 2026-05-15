const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log(users.map(u => {
    const { password, ...rest } = u;
    return rest;
  }));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
