import { prisma } from "./prisma";
import { QuotationData } from "./types";

export async function getQuotationForPDF(id: string): Promise<QuotationData | null> {
  const q = await prisma.quotation.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!q) return null;

  return {
    id: q.id,
    nomorSurat: q.nomorSurat,
    nomorUrut: q.nomorUrut,
    tanggal: q.tanggal,
    namaKlien: q.namaKlien,
    companyName: q.companyName,
    clientName: q.clientName,
    up: q.up,
    lokasi: q.lokasi,
    namaPenandatangan: q.namaPenandatangan,
    jabatanPenandatangan: q.jabatanPenandatangan,
    phonePenandatangan: q.phonePenandatangan,
    ttdStempelUrl: q.ttdStempelUrl,
    logoUrl: q.logoUrl,
    showLingkupKerja: q.showLingkupKerja,
    showSyaratGaransi: q.showSyaratGaransi,
    isHargaSatuanMode: q.isHargaSatuanMode,
    isJasaBahanMode: q.isJasaBahanMode,
    isMaterialOnlyMode: q.isMaterialOnlyMode,
    kenakanPPN: q.kenakanPPN,
    diskon: q.diskon,
    termin: q.termin ? JSON.parse(q.termin) : [],
    lingkupKerja: q.lingkupKerja ? JSON.parse(q.lingkupKerja) : [],
    syaratGaransi: q.syaratGaransi ? JSON.parse(q.syaratGaransi) : [],
    items: (q.items || []).sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((it: any) => ({
      id: it.id,
      deskripsi: it.deskripsi,
      bahan: it.bahan,
      volume: it.volume,
      satuan: it.satuan,
      harga: it.harga,
      hargaBahan: it.hargaBahan,
      hargaJasa: it.hargaJasa
    }))
  };
}
