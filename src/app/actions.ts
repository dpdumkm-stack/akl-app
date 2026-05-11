"use server";

import { prisma } from "@/lib/prisma";
import { QuotationData } from "@/lib/types";

export async function saveQuotation(data: QuotationData, totalHarga: number) {
  try {
    console.log("[saveQuotation] START - Data:", { 
        id: data.id, 
        nomorSurat: data.nomorSurat,
        itemsCount: data.items?.length,
        diskon: data.diskon,
        kenakanPPN: data.kenakanPPN
    });

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

    console.log("[saveQuotation] Recalculated Total:", calculatedTotal);

    const payload = {
      nomorSurat:           data.nomorSurat            ?? '',
      nomorUrut:            data.nomorUrut              || 1,
      tanggal:              data.tanggal               ?? '',
      namaKlien:            data.namaKlien             ?? '',
      up:                   data.up                    ?? '',
      lokasi:               data.lokasi                ?? '',
      namaPenandatangan:    data.namaPenandatangan     ?? '',
      jabatanPenandatangan: data.jabatanPenandatangan  ?? '',
      phonePenandatangan:   data.phonePenandatangan    ?? '',
      ttdStempelUrl:        data.ttdStempelUrl         ?? null,
      logoUrl:              data.logoUrl               ?? null,
      showLingkupKerja:     data.showLingkupKerja      ?? true,
      showSyaratGaransi:    data.showSyaratGaransi     ?? true,
      isHargaSatuanMode:    data.isHargaSatuanMode     ?? false,
      isJasaBahanMode:      data.isJasaBahanMode       ?? false,
      isMaterialOnlyMode:   data.isMaterialOnlyMode    ?? false,
      kenakanPPN:           data.kenakanPPN            ?? false,
      diskon:               Number(data.diskon)         || 0,
      totalHarga:           calculatedTotal, // Gunakan hasil hitung ulang server
      termin:               JSON.stringify(data.termin        ?? []),
      lingkupKerja:         JSON.stringify(data.lingkupKerja  ?? []),
      syaratGaransi:        JSON.stringify(data.syaratGaransi ?? []),
    };

    console.log("[saveQuotation] Payload ready, items count:", data.items?.length);

    let quotation;

    if (data.id) {
      // Update existing
      quotation = await prisma.quotation.update({
        where: { id: data.id },
        data: {
          ...payload,
          items: {
            deleteMany: {}, // Clean up old items
            create: data.items.map((item, index) => ({
              deskripsi:  item.deskripsi  ?? '',
              bahan:      item.bahan      ?? null,
              volume:     Number(item.volume)     || 0,
              satuan:     item.satuan     ?? 'm²',
              harga:      Number(item.harga)      || 0,
              hargaBahan: Number(item.hargaBahan) || 0,
              hargaJasa:  Number(item.hargaJasa)  || 0,
              orderIndex: index
            }))
          }
        }
      });
    } else {
      // Create new
      quotation = await prisma.quotation.create({
        data: {
          ...payload,
          items: {
            create: data.items.map((item, index) => ({
              deskripsi:  item.deskripsi  ?? '',
              bahan:      item.bahan      ?? null,
              volume:     Number(item.volume)     || 0,
              satuan:     item.satuan     ?? 'm²',
              harga:      Number(item.harga)      || 0,
              hargaBahan: Number(item.hargaBahan) || 0,
              hargaJasa:  Number(item.hargaJasa)  || 0,
              orderIndex: index
            }))
          }
        }
      });
    }

    return { success: true, id: quotation.id };
  } catch (error: any) {
    console.error("Database Error [saveQuotation]:", error);
    // Jika error.message undefined atau bukan string, berikan fallback
    const msg = error?.message || "Unknown Database Error";
    return { success: false, message: msg };
  }
}

export async function getQuotations() {
  try {
    const qs = await prisma.quotation.findMany({
      orderBy: { updatedAt: 'desc' },
      include: { items: true }
    });
    return { success: true, data: qs };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function deleteQuotation(id: string) {
  try {
    await prisma.quotation.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function getMasterItems() {
  try {
    const items = await prisma.masterItem.findMany({
      orderBy: { deskripsi: 'asc' }
    });
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function saveMasterItem(data: any) {
  try {
    if (!data.deskripsi || !data.deskripsi.trim()) {
      return { success: false, message: 'Deskripsi tidak boleh kosong' };
    }
    const payload = {
        deskripsi:  data.deskripsi.trim(),
        bahan:      data.bahan      ?? '',
        satuan:     data.satuan     ?? 'm²',
        harga:      Number(data.harga)      || 0,
        hargaBahan: Number(data.hargaBahan) || 0,
        hargaJasa:  Number(data.hargaJasa)  || 0,
    };

    let item;
    if (data.id) {
        // Jika ada ID, kita update berdasarkan ID (memungkinkan rename deskripsi)
        item = await prisma.masterItem.update({
            where: { id: data.id },
            data: payload
        });
    } else {
        // Jika tidak ada ID, gunakan upsert berdasarkan deskripsi (pola lama)
        item = await prisma.masterItem.upsert({
            where: { deskripsi: payload.deskripsi },
            update: payload,
            create: payload
        });
    }
    console.log('[saveMasterItem] OK:', item.id, item.deskripsi);
    return { success: true, data: item };
  } catch (error: any) {
    console.error('[saveMasterItem] ERROR:', error.message, '| data:', JSON.stringify(data));
    return { success: false, message: error.message };
  }
}

export async function deleteMasterItem(id: string) {
  try {
    await prisma.masterItem.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function saveGlobalSetting(id: string, value: string) {
    try {
        await prisma.globalSetting.upsert({
            where: { id },
            update: { value },
            create: { id, value }
        });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getGlobalSettings() {
    try {
        const settings = await prisma.globalSetting.findMany();
        return { success: true, data: settings };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function getSignatories() {
    try {
        const data = await prisma.signatory.findMany({ orderBy: { nama: 'asc' } });
        return { success: true, data };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function saveSignatory(data: any) {
    try {
        const payload = {
            nama:    data.nama.trim(),
            jabatan: data.jabatan.trim(),
            phone:   data.phone   ?? '',
            ttdUrl:  data.ttdUrl  ?? null,
        };
        const res = await prisma.signatory.upsert({
            where: { nama: payload.nama },
            update: payload,
            create: payload
        });
        return { success: true, data: res };
    } catch (error: any) {
        return { success: false, message: error.message };
    }
}

export async function deleteSignatory(id: string) {
    try {
        await prisma.signatory.delete({ where: { id } });
        return { success: true };
    } catch (error: any) {
        return { success: false, message: error.message };
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
        return { success: false, message: error.message };
    }
}

export async function saveInvoice(data: any) {
  try {
    console.log('[saveInvoice] START', { id: data.id, invoiceNumber: data.invoiceNumber });
    // Server‑side recalculation for safety
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
      invoiceNumber: data.invoiceNumber ?? '',
      date: data.date ? new Date(data.date) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      clientName: data.clientName ?? '',
      clientAddress: data.clientAddress ?? '',
      taxApplied: data.taxApplied ?? false,
      taxRate: Number(data.taxRate) || 0.11,
      discountAmount: discountAmount,
      downPayment: downPayment,
      notes: data.notes ?? null,
      subtotal,
      taxAmount,
      total,
      invoiceType,
    };

    let invoice;
    if (data.id) {
      invoice = await prisma.invoice.update({
        where: { id: data.id },
        data: { ...payload, items: { deleteMany: {}, create: (data.items || []).map((it: any) => ({
          description: it.description ?? '',
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })) } },
        include: { items: true },
      });
    } else {
      invoice = await prisma.invoice.create({
        data: { ...payload, items: { create: (data.items || []).map((it: any) => ({
          description: it.description ?? '',
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })) } },
        include: { items: true },
      });
    }
    return { success: true, id: invoice.id };
  } catch (error: any) {
    console.error('[saveInvoice] ERROR', error);
    return { success: false, message: error?.message || 'Unknown error' };
  }
}
