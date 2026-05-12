import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. Tentukan path absolut database secara dinamis
// Di produksi (Docker/VPS), gunakan DB_PATH dari env jika ada, 
// atau fallback ke direktori 'prisma' di root project secara absolut.
const DB_FILENAME = "dev.db";
const defaultDbPath = path.join(process.cwd(), "prisma", DB_FILENAME);

const absoluteDbPath = process.env.DB_PATH 
  ? (path.isAbsolute(process.env.DB_PATH) ? process.env.DB_PATH : path.resolve(process.env.DB_PATH))
  : defaultDbPath;

console.log(`[DATABASE] Menggunakan database di: ${absoluteDbPath}`);

// 2. Pastikan direktori database tersedia sebelum inisialisasi
try {
  const dbDir = path.dirname(absoluteDbPath);
  if (!fs.existsSync(dbDir)) {
    console.log(`[DATABASE] Membuat direktori database: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (err) {
  console.error("[DATABASE] Gagal menyiapkan direktori database:", err);
}

// 3. Inisialisasi Prisma Client dengan path absolut yang sudah ditentukan
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: `file:${absoluteDbPath}?connection_limit=1` },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
