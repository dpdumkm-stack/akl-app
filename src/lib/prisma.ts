import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. Tentukan path absolut (Prioritaskan DB_PATH dari env, fallback ke folder lokal)
const absoluteDbPath = process.env.DB_PATH 
  ? path.resolve(process.env.DB_PATH) 
  : path.join(process.cwd(), "prisma", "dev.db");

// 2. Cek apakah file database sudah ada
if (!fs.existsSync(absoluteDbPath)) {
  console.log(`[DATABASE] File database tidak ditemukan di: ${absoluteDbPath}`);
  console.log("[DATABASE] Menjalankan inisialisasi tabel otomatis...");
  try {
    // Pastikan folder induknya ada
    const dir = path.dirname(absoluteDbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    // Jalankan push schema ke database baru
    execSync(`npx prisma db push --accept-data-loss`, {
      env: { ...process.env, DATABASE_URL: `file:${absoluteDbPath}` },
      stdio: "inherit",
    });
    console.log("[DATABASE] Inisialisasi berhasil.");
  } catch (error) {
    console.error("[DATABASE] Gagal menginisialisasi database:", error);
  }
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: `file:${absoluteDbPath}` },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
