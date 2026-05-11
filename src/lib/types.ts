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
  isHargaSatuanMode: boolean;
  isJasaBahanMode: boolean;
  isMaterialOnlyMode: boolean;
  diskon: number;
  kenakanPPN: boolean;
}

export interface InvoiceItemData {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceData {
  id?: string;
  invoiceNumber: string;
  date: string; // ISO
  dueDate?: string;
  clientName: string;
  clientAddress: string;
  items: InvoiceItemData[];
  subtotal: number;
  taxRate?: number; // default 0.11
  taxApplied?: boolean;
  taxAmount?: number;
  discountAmount?: number; // total discount
  downPayment?: number; // uang muka yang sudah dibayar
  notes?: string; // catatan tambahan
  paymentMethod: 'CASH' | 'CHEQUE' | 'BILYET GIRO' | 'TRANSFER';
  total: number;
  invoiceType: 'DP' | 'PELUNASAN';
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}
