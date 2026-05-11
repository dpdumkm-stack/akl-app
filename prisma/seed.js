const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const path = require("path");

const dbPath = path.join(process.cwd(), "prisma", "dev.db");
const dbUrl = `file:${dbPath}`;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

async function main() {
  console.log("Seeding to:", dbUrl);
  
  const users = [
    { username: "admin", password: "akl", name: "Super Admin AKL" },
    { username: "apindo", password: "akl", name: "User Apindo" }
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { password: hashedPassword },
      create: {
        username: u.username,
        password: hashedPassword,
        name: u.name,
      },
    });
    console.log(`User created/updated: ${u.username}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
