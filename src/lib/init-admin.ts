import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

/**
 * Memastikan akun superadmin dan admin selalu ada di database.
 * Fungsi ini dirancang untuk berjalan satu kali saat aplikasi startup (di server side).
 */
export async function ensureAdminAccounts() {
  if (process.env.NODE_ENV === "development") {
    // Di development, biarkan manual lewat scratch script saja jika perlu
    // Tapi di produksi (Docker/VPS), ini sangat penting.
  }

  try {
    const count = await prisma.user.count();
    
    // Jika tidak ada user sama sekali, atau superadmin hilang, daftarkan ulang.
    const superExists = await prisma.user.findUnique({ where: { username: "superadmin" } });
    
    if (!superExists) {
      console.log("[INIT] Superadmin not found. Creating default administrative accounts...");
      
      const hashedSuper = await bcrypt.hash("qila2026", 10);
      const hashedAdmin = await bcrypt.hash("password123", 10);

      await prisma.user.upsert({
        where: { username: "superadmin" },
        update: {}, // Jangan timpa jika ternyata ada (findUnique di atas sudah menjaga)
        create: {
          username: "superadmin",
          password: hashedSuper,
          role: "OWNER",
          name: "Super Admin",
        },
      });

      await prisma.user.upsert({
        where: { username: "admin" },
        update: {},
        create: {
          username: "admin",
          password: hashedAdmin,
          role: "OWNER",
          name: "Admin Utama",
        },
      });
      
      console.log("[INIT] Administrative accounts successfully synchronized.");
    }

    // --- BARU: Sinkronisasi Nomor Urut (Quotation & Invoice) ---
    const year = new Date().getFullYear();
    
    // Sinkronisasi INVOICE
    const latestInv = await prisma.invoice.findFirst({
      where: { date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      orderBy: { nomorUrut: 'desc' }
    });
    const currentInvUrut = latestInv?.nomorUrut || 0;
    
    await prisma.documentSequence.upsert({
      where: { type_year: { type: 'INVOICE', year } },
      update: { lastUrut: { set: Math.max(currentInvUrut, 0) } }, // Update jika sudah ada tapi lebih kecil
      create: { type: 'INVOICE', year, lastUrut: currentInvUrut }
    });

    // Sinkronisasi QUOTATION
    const latestQuot = await prisma.quotation.findFirst({
      where: { createdAt: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
      orderBy: { nomorUrut: 'desc' }
    });
    const currentQuotUrut = latestQuot?.nomorUrut || 0;

    await prisma.documentSequence.upsert({
      where: { type_year: { type: 'QUOTATION', year } },
      update: { lastUrut: { set: Math.max(currentQuotUrut, 0) } },
      create: { type: 'QUOTATION', year, lastUrut: currentQuotUrut }
    });

    console.log(`[INIT] Document sequences synchronized (INV: ${currentInvUrut}, QUOT: ${currentQuotUrut})`);

  } catch (error) {
    console.error("[INIT] Failed to ensure admin accounts or sync sequences:", error);
  }
}
