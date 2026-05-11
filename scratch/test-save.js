const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const payload = {
      nomorSurat: "TEST/001",
      nomorUrut: 1,
      tanggal: "1 Januari 2026",
      namaKlien: "TEST KLIEN",
      namaPenandatangan: "TEST APIP",
      jabatanPenandatangan: "TEST JABATAN",
      termin: JSON.stringify(["Termin 1"]),
      lingkupKerja: JSON.stringify(["Lingkup 1"]),
      syaratGaransi: JSON.stringify(["Syarat 1"]),
      totalHarga: 1000
    };

    const q = await prisma.quotation.create({
      data: {
        ...payload,
        items: {
          create: [
            {
              deskripsi: "Item 1",
              volume: 1,
              satuan: "m2",
              harga: 1000
            }
          ]
        }
      }
    });
    console.log("SUCCESS:", q.id);
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
