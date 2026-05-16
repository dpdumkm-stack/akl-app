export interface QuotationItem {
  id: string;
  deskripsi: string;
  bahan: string | null;
  volume: number;
  satuan: string;
  harga: number;
  hargaBahan: number;
  hargaJasa: number;
  masterId?: string; // ID dari database master untuk tracking edit
}

export interface QuotationData {
  id?: string;
  nomorUrut?: number;
  nomorSurat: string;
  tanggal: string;
  namaKlien: string;
  companyName?: string;
  clientName?: string;
  up: string;
  lokasi: string;
  logoUrl: string | null;
  ttdStempelUrl: string | null;
  namaPenandatangan: string;
  jabatanPenandatangan: string;
  phonePenandatangan: string;
  termin: string[];
  lingkupKerja: string[];
  syaratGaransi: string[];
  items: QuotationItem[];
  showLingkupKerja: boolean;
  showSyaratGaransi: boolean;
  showTermin?: boolean;
  isHargaSatuanMode: boolean;
  isJasaBahanMode: boolean;
  isMaterialOnlyMode: boolean;
  diskon: number;
  kenakanPPN: boolean;
  isInvoiced?: boolean;
}

export interface InvoiceItemData {
  id: string;
  description: string;
  quantity: number;
  volume?: number | string | null;
  satuan?: string | null;
  unitPrice: number;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  nomorUrut?: number;
  date: string; // ISO
  dueDate?: string;
  clientName?: string;
  companyName?: string;
  clientAddress?: string;
  items: InvoiceItemData[];
  subtotal: number;
  taxRate?: number; // default 0.11
  taxApplied?: boolean;
  taxAmount?: number;
  discountAmount?: number; // total discount
  retentionPercent?: number; // persentase retensi
  retentionAmount?: number; // nilai retensi
  downPaymentPercent?: number; // persentase uang muka
  downPayment?: number; // uang muka yang sudah dibayar
  poNumber?: string; // nomor PO referensi
  notes?: string; // catatan tambahan
  paymentMethod: 'CASH' | 'CHEQUE' | 'BILYET GIRO' | 'TRANSFER';
  total: number;
  invoiceType: 'DP' | 'PELUNASAN' | 'RETENSI';
  quotationId?: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  namaPenandatangan?: string;
  jabatanPenandatangan?: string;
  phonePenandatangan?: string;
  ttdStempelUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
