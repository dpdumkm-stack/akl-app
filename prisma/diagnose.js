const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function diagnose() {
  console.log("--- DIAGNOSA AUTENTIKASI ---");
  
  const user = await prisma.user.findUnique({
    where: { username: "admin" }
  });

  if (!user) {
    console.error("ERROR: User 'admin' TIDAK DITEMUKAN di database!");
    return;
  }

  console.log("OK: User 'admin' ditemukan.");
  console.log("Hash di database:", user.password);

  const testPassword = "akl";
  const isValid = await bcrypt.compare(testPassword, user.password);

  if (isValid) {
    console.log("OK: Password 'akl' COCOK dengan hash di database.");
  } else {
    console.error("ERROR: Password 'akl' TIDAK COCOK dengan hash!");
    
    // Coba hash ulang dan bandingkan
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log("Saran Hash Baru:", newHash);
  }
}

diagnose()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
