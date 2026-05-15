import { prisma } from "./prisma";

/**
 * Mendapatkan nomor urut berikutnya secara atomic menggunakan Prisma Transaction.
 * Hal ini mencegah tabrakan nomor jika dua admin menyimpan di detik yang sama.
 */
export async function getNextSequenceAtomic(type: "QUOTATION" | "INVOICE") {
  const year = new Date().getFullYear();

  return await prisma.$transaction(async (tx) => {
    // Cari sequence untuk tahun ini
    const seq = await tx.documentSequence.upsert({
      where: { 
        type_year: { type, year } 
      },
      update: { 
        lastUrut: { increment: 1 } 
      },
      create: { 
        type, 
        year, 
        lastUrut: 1 
      },
    });

    return seq.lastUrut;
  });
}
