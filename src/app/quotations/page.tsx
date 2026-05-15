"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Search, FileText, ArrowLeft, MoreVertical, 
  Printer, Download, Receipt, Trash2, Edit2, 
  ChevronRight, Calendar, Filter, Plus, AlertCircle
} from "lucide-react";
import { convertToInvoice } from "@/app/actions";
import PrintingProgress from "@/components/PrintingProgress";

interface Quotation {
  id: string;
  nomorSurat: string;
  namaKlien: string;
  tanggal: string;
  totalHarga: number;
  isInvoiced?: boolean;
  createdAt: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function QuotationArchivePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quotations/list");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const d = await res.json();
        if (d.success) setQuotations(d.quotations || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const filteredData = quotations
    .filter(q => 
      q.namaKlien?.toLowerCase().includes(search.toLowerCase()) ||
      q.nomorSurat?.toLowerCase().includes(search.toLowerCase())
    );

  const displayData = search ? filteredData : filteredData.slice(0, 10);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleConvertToInvoice = async (id: string, name: string) => {
    if (!window.confirm(`Konfirmasi: Terbitkan Invoice untuk ${name}?`)) return;
    try {
      const res = await convertToInvoice(id);
      if (res.success) {
        showToast("Invoice berhasil diterbitkan!");
        loadData(); // Refresh list
      } else {
        showToast(res.message, "error");
      }
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  const handleDelete = async (id: string, nomor: string) => {
    if (!window.confirm(`Hapus penawaran ${nomor}? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Penawaran dihapus.");
        loadData();
      } else {
        showToast("Gagal menghapus.", "error");
      }
    } catch (e) {
      showToast("Gagal menghapus.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/dashboard")}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white uppercase italic">Arsip Penawaran</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Management System</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => router.push("/quotations/create")}
            className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" /> Buat Penawaran Baru
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Search & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama klien atau nomor surat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Filter className="w-3.5 h-3.5" /> Filter: Terbaru
             </div>
             <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">Total: {filteredData.length} Dokumen</p>
          </div>
        </div>

        {/* Data List Container */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <div className="col-span-4">Informasi Klien</div>
            <div className="col-span-2 text-center">Nomor Surat</div>
            <div className="col-span-2 text-center">Tanggal</div>
            <div className="col-span-2 text-right">Total Harga</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-4">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Memuat Arsip...</p>
              </div>
            ) : displayData.length === 0 ? (
              <div className="py-24 text-center space-y-4">
                 <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-white/5">
                    <FileText className="w-8 h-8 text-slate-800" />
                 </div>
                 <p className="text-slate-600 font-medium italic">Tidak ada data penawaran yang ditemukan.</p>
              </div>
            ) : displayData.map(q => (
              <div key={q.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-8 py-6 hover:bg-white/[0.02] transition-all group">
                {/* Client Info */}
                <div className="col-span-4 flex items-center gap-5">
                   <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-white/5 flex items-center justify-center text-xs font-black text-slate-500 group-hover:border-blue-500/30 group-hover:text-blue-400 transition-all uppercase">
                      {q.namaKlien?.substring(0, 2)}
                   </div>
                   <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{q.namaKlien}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        {q.isInvoiced && (
                          <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            Terbit Invoice
                          </span>
                        )}
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">Status: Active</span>
                      </div>
                   </div>
                </div>

                {/* ID */}
                <div className="col-span-2 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Surat</p>
                  <p className="text-[10px] font-medium text-slate-600 truncate">{q.nomorSurat}</p>
                </div>

                {/* Date */}
                <div className="col-span-2 text-center flex flex-col items-center">
                   <Calendar className="w-3.5 h-3.5 text-slate-700 mb-1" />
                   <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(q.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>

                {/* Amount */}
                <div className="col-span-2 text-right">
                   <p className="text-xs font-black text-blue-500">{fmt(q.totalHarga)}</p>
                   <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Net Total</p>
                </div>

                {/* Actions */}
                <div className="col-span-2 flex justify-end gap-1">
                  <div className="flex items-center gap-1.5">
                    {/* PRINT VIEW (INLINE PDF) */}
                    <button 
                      onClick={() => window.open(`/api/pdf?id=${q.id}&mode=inline`, '_blank')}
                      className="p-2 bg-slate-950 hover:bg-blue-600/10 text-slate-600 hover:text-blue-400 rounded-lg transition-all border border-white/5" 
                      title="Cetak"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* DOWNLOAD PDF */}
                    <button 
                      onClick={() => {
                        setIsGeneratingPDF(true);
                        setPrintProgress(0);
                        const progressInterval = setInterval(() => {
                          setPrintProgress(prev => {
                            if (prev >= 99.5) return 99.5;
                            const diff = prev < 70 ? 3.0 : prev < 90 ? 1.5 : prev < 95 ? 0.8 : 0.2;
                            return prev + diff;
                          });
                        }, 150);

                        fetch(`/api/pdf?id=${q.id}&mode=attachment`)
                          .then(res => {
                            if (!res.ok) throw new Error("Gagal");
                            const contentDisposition = res.headers.get('Content-Disposition');
                            let filename = `Dokumen_${q.nomorSurat}.pdf`;
                            if (contentDisposition) {
                              const match = contentDisposition.match(/filename="(.+)"/);
                              if (match) filename = match[1];
                            }
                            return res.blob().then(blob => ({ blob, filename }));
                          })
                          .then(({ blob, filename }) => {
                            clearInterval(progressInterval);
                            setPrintProgress(100);
                            
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            
                            setTimeout(() => {
                              setIsGeneratingPDF(false);
                              setPrintProgress(0);
                            }, 600);
                          })
                          .catch(() => {
                            clearInterval(progressInterval);
                            setIsGeneratingPDF(false);
                            showToast("Gagal mengunduh PDF", "error");
                          });
                      }}
                      className="p-2 bg-slate-950 hover:bg-indigo-600/10 text-slate-600 hover:text-indigo-400 rounded-lg transition-all border border-white/5" 
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    {!q.isInvoiced && (
                      <button 
                        onClick={() => handleConvertToInvoice(q.id, q.namaKlien)}
                        className="p-2 bg-slate-950 hover:bg-emerald-600/10 text-slate-600 hover:text-emerald-400 rounded-lg transition-all border border-white/5"
                        title="Terbitkan Invoice"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button 
                      onClick={() => router.push(`/quotations/edit/${q.id}`)}
                      className="p-2 bg-slate-950 hover:bg-amber-600/10 text-slate-600 hover:text-amber-400 rounded-lg transition-all border border-white/5"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {(session?.user as any)?.role === "OWNER" && (
                      <button 
                        onClick={() => handleDelete(q.id, q.nomorSurat)}
                        className="p-2 bg-slate-950 hover:bg-red-600/10 text-slate-600 hover:text-red-400 rounded-lg transition-all border border-white/5"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Progress Overlay */}
      <PrintingProgress isOpen={isGeneratingPDF} progress={printProgress} />

      {toast && (
        <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-[20px] shadow-2xl z-[100] flex items-center gap-3 animate-in fade-in slide-in-from-right-4 ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
           <AlertCircle className="w-5 h-5" />
           <p className="text-sm font-black uppercase tracking-widest">{toast.msg}</p>
        </div>
      )}
    </div>
  );
}
