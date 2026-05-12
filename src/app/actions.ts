"use server";

import { prisma } from "@/lib/prisma";
import { QuotationData } from "@/lib/types";
import { getServerSession } from "next-auth/next";
import { logActivity } from "@/lib/logger";

/**
 * Memastikan objek murni (Plain Object) yang bisa diserialisasi oleh Next.js.
 * Penting untuk menghindari error "Server Components render" di produksi.
 */
function toPlainObject<T>(obj: T): T {
    if (!obj) return obj;
    return JSON.parse(JSON.stringify(obj));
}

// Fungsi Sanitasi Sederhana
const sanitize = (str: string | null | undefined) => {
    if (!str) return "";
    if (typeof str !== 'string') return String(str);
    return str.trim().replace(/[\x00-\x1F\x7F]/g, ""); // Hapus karakter kontrol non-printable
};

async function checkAuth() {
    const session = await getServerSession();
    if (!session) {
        throw new Error("Unauthorized: Anda harus login untuk melakukan tindakan ini.");
    }
    return session;
}

export async function saveQuotation(data: QuotationData, totalHarga: number) {
  try {
    await checkAuth();
    logActivity(`Memulai simpan Penawaran: ${data.nomorSurat || 'DRAFT'}`, 'INFO');
    
    const payloadSize = JSON.stringify(data).length;
    console.log(`[saveQuotation] START - ID: ${data.id}, Nomor: ${data.nomorSurat}, Payload Size: ${(payloadSize / 1024).toFixed(2)} KB`);

    // SCSA VALIDATION LOGIC: Minimal salah satu harus diisi
    const company = data.companyName?.trim() || "";
    const client = data.clientName?.trim() || "";

    if (!company && !client) {
        logActivity(`GAGAL simpan: Nama PT & Pribadi kosong`, 'ERROR');
        return { success: false, message: "Mohon isi nama perusahaan atau nama pribadi" };
    }

    // Gabungkan untuk namaKlien (sebagai fallback tampilan lama)
    const displayClientName = company || client;

    const finalNomorSurat = (data.nomorSurat && data.nomorSurat.trim() !== "") 
        ? sanitize(data.nomorSurat) 
        : `DRAFT-${new Date().getTime()}`;

    // Safe Mode: Recalculate total on server to prevent mismatches
    const calculatedSubtotal = (data.items || []).reduce((acc, i) => {
        const hBahan = Number(i.hargaBahan) || 0;
        const hJasa = Number(i.hargaJasa) || 0;
        const hSatuan = Number(i.harga) || 0;
        const vol = Number(i.volume) || 0;

        let price = data.isMaterialOnlyMode ? hBahan : (data.isJasaBahanMode ? (hBahan + hJasa) : hSatuan);
        return acc + (vol * price);
    }, 0);
    const calculatedDpp = calculatedSubtotal - (Number(data.diskon) || 0);
    const calculatedTotal = calculatedDpp + (data.kenakanPPN ? calculatedDpp * 0.11 : 0);

    const payload = {
      nomorSurat:           finalNomorSurat,
      nomorUrut:            Number(data.nomorUrut)      || 1,
      tanggal:              sanitize(data.tanggal),
      namaKlien:            sanitize(displayClientName),
      companyName:          sanitize(company),
      clientName:           sanitize(client),
      up:                   sanitize(data.up),
      lokasi:               sanitize(data.lokasi),
      namaPenandatangan:    sanitize(data.namaPenandatangan),
      jabatanPenandatangan: sanitize(data.jabatanPenandatangan),
      phonePenandatangan:   sanitize(data.phonePenandatangan),
      ttdStempelUrl:        data.ttdStempelUrl         ?? null,
      logoUrl:              data.logoUrl               ?? null,
      showLingkupKerja:     !!data.showLingkupKerja,
      showSyaratGaransi:    !!data.showSyaratGaransi,
      isHargaSatuanMode:    !!data.isHargaSatuanMode,
      isJasaBahanMode:      !!data.isJasaBahanMode,
      isMaterialOnlyMode:   !!data.isMaterialOnlyMode,
      kenakanPPN:           !!data.kenakanPPN,
      diskon:               Number(data.diskon)         || 0,
      totalHarga:           calculatedTotal,
      termin:               JSON.stringify(data.termin        ?? []),
      lingkupKerja:         JSON.stringify(data.lingkupKerja  ?? []),
      syaratGaransi:        JSON.stringify(data.syaratGaransi ?? []),
    };

    let quotation;

    if (data.id) {
      quotation = await prisma.quotation.update({
        where: { id: data.id },
        data: {
          ...payload,
          items: {
            deleteMany: {},
            create: (data.items || []).map((item, index) => ({
              deskripsi:  sanitize(item.deskripsi),
              bahan:      sanitize(item.bahan),
              volume:     Number(item.volume)     || 0,
              satuan:     sanitize(item.satuan)   || 'm²',
              harga:      Number(item.harga)      || 0,
              hargaBahan: Number(item.hargaBahan) || 0,
              hargaJasa:  Number(item.hargaJasa)  || 0,
              orderIndex: index
            }))
          }
        }
      });
    } else {
      quotation = await prisma.quotation.create({
        data: {
          ...payload,
          items: {
            create: (data.items || []).map((item, index) => ({
              deskripsi:  sanitize(item.deskripsi),
              bahan:      sanitize(item.bahan),
              volume:     Number(item.volume)     || 0,
              satuan:     sanitize(item.satuan)   || 'm²',
              harga:      Number(item.harga)      || 0,
              hargaBahan: Number(item.hargaBahan) || 0,
              hargaJasa:  Number(item.hargaJasa)  || 0,
              orderIndex: index
            }))
          }
        }
      });
    }

    logActivity(`Berhasil simpan Penawaran: ${quotation.nomorSurat} (ID: ${quotation.id})`, 'SUCCESS');
    return { success: true, id: quotation.id };
  } catch (error: any) {
    logActivity(`GAGAL simpan Penawaran: ${error.message}`, 'ERROR');
    console.error("[saveQuotation] FATAL ERROR:", error);
    const isProd = process.env.NODE_ENV === 'production';
    const msg = isProd ? "Gagal menyimpan data ke server. Silakan coba lagi." : (error?.message || "Unknown Database Error");
    return { success: false, message: msg };
  }
}

export async function getQuotations() {
  try {
    const qs = await prisma.quotation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { items: true }
    });
    return toPlainObject({ success: true, data: qs });
  } catch (error: any) {
    console.error("[getQuotations] Error:", error);
    return { success: false, message: "Gagal mengambil data dari database." };
  }
}

export async function deleteQuotation(id: string) {
  try {
    await checkAuth();
    await prisma.quotation.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error("[deleteQuotation] Error:", error);
    return { success: false, message: "Gagal menghapus data." };
  }
}

export async function getMasterItems() {
  try {
    const items = await prisma.masterItem.findMany({
      orderBy: { deskripsi: 'asc' }
    });
    return toPlainObject({ success: true, data: items });
  } catch (error: any) {
    console.error("[getMasterItems] Error:", error);
    return { success: false, message: "Gagal mengambil database master." };
  }
}

export async function saveMasterItem(data: any) {
  try {
    await checkAuth();
    if (!data.deskripsi || !data.deskripsi.trim()) {
      return { success: false, message: 'Deskripsi tidak boleh kosong' };
    }
    const payload = {
        deskripsi:  sanitize(data.deskripsi),
        bahan:      sanitize(data.bahan),
        satuan:     sanitize(data.satuan) || 'm²',
        harga:      Number(data.harga)      || 0,
        hargaBahan: Number(data.hargaBahan) || 0,
        hargaJasa:  Number(data.hargaJasa)  || 0,
    };

    let item;
    if (data.id) {
        item = await prisma.masterItem.update({
            where: { id: data.id },
            data: payload
        });
    } else {
        item = await prisma.masterItem.upsert({
            where: { deskripsi: payload.deskripsi },
            update: payload,
            create: payload
        });
    }
    return toPlainObject({ success: true, data: item });
  } catch (error: any) {
    console.error("[saveMasterItem] Error:", error);
    return { success: false, message: "Gagal menyimpan item master." };
  }
}

export async function deleteMasterItem(id: string) {
  try {
    await checkAuth();
    await prisma.masterItem.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    console.error("[deleteMasterItem] Error:", error);
    return { success: false, message: "Gagal menghapus item master." };
  }
}

export async function saveGlobalSetting(id: string, value: string) {
    try {
        await checkAuth();
        await prisma.globalSetting.upsert({
            where: { id },
            update: { value },
            create: { id, value }
        });
        return { success: true };
    } catch (error: any) {
        console.error("[saveGlobalSetting] Error:", error);
        return { success: false, message: "Gagal menyimpan pengaturan." };
    }
}

export async function getGlobalSettings() {
    try {
        const settings = await prisma.globalSetting.findMany();
        return toPlainObject({ success: true, data: settings });
    } catch (error: any) {
        console.error("[getGlobalSettings] Error:", error);
        return { success: false, message: "Gagal memuat pengaturan." };
    }
}

export async function getSignatories() {
    try {
        const data = await prisma.signatory.findMany({ orderBy: { nama: 'asc' } });
        return toPlainObject({ success: true, data });
    } catch (error: any) {
        console.error("[getSignatories] Error:", error);
        return { success: false, message: "Gagal mengambil daftar penandatangan." };
    }
}

export async function saveSignatory(data: any) {
    try {
        await checkAuth();
        const payload = {
            nama:    sanitize(data.nama),
            jabatan: sanitize(data.jabatan),
            phone:   sanitize(data.phone),
            ttdUrl:  data.ttdUrl  ?? null,
        };
        const res = await prisma.signatory.upsert({
            where: { nama: payload.nama },
            update: payload,
            create: payload
        });
        return toPlainObject({ success: true, data: res });
    } catch (error: any) {
        console.error("[saveSignatory] Error:", error);
        return { success: false, message: "Gagal menyimpan data penandatangan." };
    }
}

export async function deleteSignatory(id: string) {
    try {
        await checkAuth();
        await prisma.signatory.delete({ where: { id } });
        return { success: true };
    } catch (error: any) {
        console.error("[deleteSignatory] Error:", error);
        return { success: false, message: "Gagal menghapus penandatangan." };
    }
}

export async function getNextQuotationNumber() {
    try {
        const year = new Date().getFullYear();
        const latest = await prisma.quotation.findFirst({
            where: {
                createdAt: {
                    gte: new Date(year, 0, 1),
                    lt: new Date(year + 1, 0, 1),
                }
            },
            orderBy: { nomorUrut: 'desc' }
        });

        const nextUrut = (latest?.nomorUrut || 0) + 1;
        return { success: true, nextUrut };
    } catch (error: any) {
        console.error("[getNextQuotationNumber] Error:", error);
        return { success: false, message: "Gagal membuat nomor surat otomatis." };
    }
}

export async function saveInvoice(data: any) {
  try {
    await checkAuth();
    logActivity(`Memulai simpan Invoice: ${data.invoiceNumber || 'DRAFT'}`, 'INFO');
    
    if (!data.invoiceNumber || !data.clientName) {
      return { success: false, message: "Nomor Invoice dan Nama Klien wajib diisi." };
    }

    const subtotal = (data.items || []).reduce((acc: number, i: any) => {
      const qty = Number(i.quantity) || 0;
      const price = Number(i.unitPrice) || 0;
      return acc + qty * price;
    }, 0);
    const discountAmount = Number(data.discountAmount) || 0;
    const dpp = subtotal - discountAmount;
    const taxAmount = data.taxApplied ? dpp * Number(data.taxRate || 0.11) : 0;
    const grandTotal = dpp + taxAmount;
    const invoiceType = data.invoiceType || "PELUNASAN";
    const downPayment = Number(data.downPayment || 0);
    const total = invoiceType === "DP" ? downPayment : (grandTotal - downPayment);

    const payload = {
      invoiceNumber: sanitize(data.invoiceNumber),
      date: data.date ? new Date(data.date) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientName: sanitize(data.clientName),
      clientAddress: sanitize(data.clientAddress),
      taxApplied: !!data.taxApplied,
      taxRate: Number(data.taxRate) || 0.11,
      discountAmount: discountAmount,
      downPayment: downPayment,
      notes: sanitize(data.notes),
      subtotal,
      taxAmount,
      total,
      invoiceType,
    };

    let invoice;
    if (data.id) {
      invoice = await prisma.invoice.update({
        where: { id: data.id },
        data: { 
            ...payload, 
            items: { 
                deleteMany: {}, 
                create: (data.items || []).map((it: any) => ({
                    description: sanitize(it.description),
                    quantity: Number(it.quantity) || 0,
                    unitPrice: Number(it.unitPrice) || 0,
                })) 
            } 
        },
      });
    } else {
      invoice = await prisma.invoice.create({
        data: { 
            ...payload, 
            items: { 
                create: (data.items || []).map((it: any) => ({
                    description: sanitize(it.description),
                    quantity: Number(it.quantity) || 0,
                    unitPrice: Number(it.unitPrice) || 0,
                })) 
            } 
        },
      });
    }
    logActivity(`Berhasil simpan Invoice: ${invoice.invoiceNumber} (ID: ${invoice.id})`, 'SUCCESS');
    return { success: true, id: invoice.id };
  } catch (error: any) {
    logActivity(`GAGAL simpan Invoice: ${error.message}`, 'ERROR');
    console.error("[saveInvoice] Error:", error);
    return { success: false, message: "Terjadi kesalahan saat menyimpan Invoice." };
  }
}
