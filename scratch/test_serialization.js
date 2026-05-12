
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const qs = await prisma.quotation.findMany({
      take: 1,
      include: { items: true }
    });
    console.log("Data fetched:", JSON.stringify(qs, null, 2));
    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

test();
