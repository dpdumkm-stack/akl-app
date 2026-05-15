"use client";

import React, { useEffect, useState } from "react";
import { getQuotations, deleteQuotation } from "@/app/actions";
import { QuotationData, QuotationItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { X, Search, Clock, FileText, Trash2, Loader2, AlertCircle, Copy } from "lucide-react";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoad: (data: QuotationData) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  setConfirmModal: (modal: any) => void;
}

export default function HistoryDrawer({ isOpen, onClose, onLoad, showToast, setConfirmModal }: HistoryDrawerProps) {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const res = await getQuotations();
      if (res.success && 'data' in res) {
        setQuotations(res.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data riwayat", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchQuotations();
    }
  }, [isOpen]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    setConfirmModal({
      title: "Hapus Penawaran?",
      message: "Data ini akan dihapus secara permanen dari database. Tindakan ini tidak dapat dibatalkan.",
      onConfirm: async () => {
        try {
          const res = await deleteQuotation(id);
          if (res.success) {
            setQuotations(prev => prev.filter(q => q.id !== id));
            showToast("Penawaran berhasil dihapus.");
          } else {
            showToast("Gagal menghapus data.", "error");
          }
        } catch (error) {
          console.error(error);
          showToast("Terjadi kesalahan sistem.", "error");
        }
      },
      confirmText: "Hapus Permanen",
      type: 'danger'
    });
  };

  const handleSelect = (q: any) => {
    const loadedData: QuotationData = {
      id: q.id,
      nomorSurat: q.nomorSurat,
      nomorUrut: q.nomorUrut,
      tanggal: q.tanggal,
      namaKlien: q.namaKlien,
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
    onLoad(loadedData);
    onClose();
    showToast(`Dokumen "${q.namaKlien}" dimuat untuk diedit.`);
  };

  const handleClone = (e: React.MouseEvent, q: any) => {
    e.stopPropagation();
    const clonedData: QuotationData = {
      nomorSurat: q.nomorSurat + " (Copy)",
      tanggal: new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}),
      namaKlien: q.namaKlien + " (Copy)",
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
        id: Math.random().toString(36).substr(2, 9), // New random ID for items
        deskripsi: it.deskripsi,
        bahan: it.bahan,
        volume: it.volume,
        satuan: it.satuan,
        harga: it.harga,
        hargaBahan: it.hargaBahan,
        hargaJasa: it.hargaJasa
      }))
    };
    onLoad(clonedData);
    onClose();
    showToast(`Dokumen diduplikasi. Silakan simpan sebagai draf baru.`);
  };

  const filteredQs = quotations.filter(q => 
    (q.namaKlien || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (q.nomorSurat || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end no-print">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Clock className="w-5 h-5"/></div>
            <div>
              <h2 className="font-black text-slate-800 uppercase tracking-wider text-sm">Riwayat Dokumen</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{quotations.length} Penawaran Tersimpan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-7 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Cari Nama Klien / Nomor Surat..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-slate-50/50">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs font-bold uppercase tracking-widest">Memuat Database...</p>
            </div>
          ) : filteredQs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 space-y-3">
              <AlertCircle className="w-8 h-8 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Tidak Ada Data Ditemukan</p>
            </div>
          ) : (
            filteredQs.map(q => (
              <div 
                key={q.id} 
                onClick={() => handleSelect(q)}
                className="group p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer relative"
              >
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => handleClone(e, q)} 
                    className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all" 
                    title="Duplikasi (Copy)"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, q.id)} 
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                    title="Hapus Permanen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="mt-1"><FileText className="w-5 h-5 text-blue-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs font-black text-slate-800 uppercase tracking-wide mb-1 pr-8 truncate max-w-[250px]">{q.namaKlien || 'KLIEN TANPA NAMA'}</p>
                    <p className="text-[10px] font-bold text-slate-500 mb-2">{q.nomorSurat}</p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{new Date(q.updatedAt).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}</span>
                      <span className="text-[10px] font-black text-emerald-600 tracking-wider">{formatCurrency(q.totalHarga)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
