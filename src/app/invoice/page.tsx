"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Receipt, Plus, Trash2, Edit2, CheckCircle, 
  ArrowLeft, Banknote, Check, Wallet, RotateCcw, 
  AlertCircle, Printer, Search, TrendingUp, Download
} from "lucide-react";
import PrintingProgress from "@/components/PrintingProgress";

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string | null;
  clientName: string;
  companyName?: string | null;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  invoiceType: "DP" | "PELUNASAN";
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function InvoiceArchivePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [paymentInv, setPaymentInv] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>("");
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoice/list");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const data = await res.json();
        if (data.success) setInvoices(data.invoices);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (status === "authenticated") loadInvoices();
  }, [status, loadInvoices]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filteredInvoices = invoices
    .filter(inv => {
      const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;
      const query = searchQuery.toLowerCase();
      const matchesSearch = inv.clientName.toLowerCase().includes(query) || 
                            (inv.companyName || "").toLowerCase().includes(query) ||
                            inv.invoiceNumber.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    })
    .slice(0, searchQuery ? undefined : 5);

  const handleQuickPayment = async (inv: Invoice, isFull: boolean = false) => {
    if (isFull && !window.confirm(`Konfirmasi: Tandai LUNAS untuk ${inv.invoiceNumber}?`)) return;
    setUpdatingPayment(true);
    try {
      const res = await fetch("/api/invoice/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id, amount: isFull ? 0 : Number(newPaymentAmount), isFullPayment: isFull }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          showToast(isFull ? "Invoice ditandai lunas" : "Pembayaran ditambahkan");
          setPaymentInv(null);
          setNewPaymentAmount("");
          loadInvoices();
        } else {
          showToast(data.error || "Gagal update", "error");
        }
      }
    } catch {
      showToast("Gagal update", "error");
    }
    setUpdatingPayment(false);
  };

  const handleRevertPayment = async (inv: Invoice) => {
    if (!window.confirm(`Batalkan status LUNAS untuk ${inv.invoiceNumber}?`)) return;
    setUpdatingPayment(true);
    try {
      const res = await fetch("/api/invoice/payment/revert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          showToast("Status kembali ke PENDING");
          loadInvoices();
        }
      }
    } catch {
      showToast("Gagal membatalkan", "error");
    }
    setUpdatingPayment(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/invoice/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const data = await res.json();
        if (data.success) {
          showToast("Invoice dihapus");
          setDeleteId(null);
          loadInvoices();
        }
      }
    } catch {
      showToast("Gagal menghapus", "error");
    }
  };

  if (status === "loading") return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600/10 rounded-xl flex items-center justify-center">
                <Receipt className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-sm font-black tracking-tight text-white uppercase italic">Manajemen Invoice</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">PT. Apindo Karya Lestari</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => router.push("/invoice/create")} 
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" /> Buat Invoice Baru
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        {/* Header, Search & Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-lg group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Cari pelanggan atau nomor invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all shadow-inner"
            />
          </div>
          
          <div className="flex items-center gap-8 px-8 py-4 bg-slate-900/50 border border-white/5 rounded-[32px] backdrop-blur-sm">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Piutang (Pending)</p>
              <p className="text-lg font-black text-emerald-400">
                {fmt(invoices.reduce((a, b) => a + (b.status === 'PENDING' ? b.total : 0), 0))}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-white/5 rounded-2xl w-fit">
          {["ALL", "PENDING", "PAID"].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" 
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              {f === "ALL" ? "Semua" : f === "PAID" ? "Lunas" : "Pending"}
            </button>
          ))}
        </div>

        {/* List Container */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="hidden md:grid grid-cols-12 gap-4 px-10 py-6 border-b border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <div className="col-span-4">Pelanggan</div>
            <div className="col-span-2 text-center">Nomor Invoice</div>
            <div className="col-span-2 text-center">Tgl / Jatuh Tempo</div>
            <div className="col-span-2 text-right">Total Tagihan</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>

          <div className="divide-y divide-white/[0.03]">
            {loading ? (
              <div className="py-32 flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Memuat Arsip...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="py-32 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-white/5">
                  <Receipt className="w-8 h-8 text-slate-800" />
                </div>
                <p className="text-slate-600 font-medium italic">Data invoice tidak ditemukan.</p>
              </div>
            ) : filteredInvoices.slice(0, searchQuery ? undefined : 5).map((inv) => (
              <div key={inv.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-10 py-7 hover:bg-white/[0.02] transition-all group border-l-4 border-l-transparent hover:border-l-emerald-500/50">
                <div className="col-span-4 flex items-center gap-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black border transition-all ${
                    inv.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                    {inv.status === 'PAID' ? 'LNS' : 'PND'}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">{inv.companyName || inv.clientName}</h4>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      }`}>
                        {inv.status}
                      </span>
                      <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{inv.invoiceType}</span>
                    </div>
                  </div>
                </div>

                <div className="col-span-2 text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 text-slate-600">Doc No.</p>
                  <p className="text-[10px] font-medium text-slate-500 truncate">{inv.invoiceNumber}</p>
                </div>

                <div className="col-span-2 text-center">
                  <p className="text-[10px] font-bold text-slate-200 uppercase">{new Date(inv.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase mt-1">Due: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) : '-'}</p>
                </div>

                <div className="col-span-2 text-right">
                  <p className="text-sm font-black text-white">{fmt(inv.total)}</p>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Net Amount</p>
                </div>

                <div className="col-span-2 flex justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                  {inv.status === 'PAID' ? (
                    <button onClick={() => handleRevertPayment(inv)} className="p-2.5 bg-slate-950 hover:bg-amber-600/10 text-slate-600 hover:text-amber-500 rounded-xl border border-white/5 transition-all" title="Batal Lunas">
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button onClick={() => setPaymentInv(inv)} className="p-2.5 bg-slate-950 hover:bg-blue-600/10 text-slate-600 hover:text-blue-400 rounded-xl border border-white/5 transition-all" title="Update Bayar">
                        <Banknote className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleQuickPayment(inv, true)} className="p-2.5 bg-slate-950 hover:bg-emerald-600/10 text-slate-600 hover:text-emerald-400 rounded-xl border border-white/5 transition-all" title="Tandai Lunas">
                        <Check className="w-4 h-4" />
                      </button>
                    </>
                  )}
                   {/* PRINT VIEW (INLINE PDF - ADOBE/CHROME STYLE) */}
                   <button 
                     onClick={() => window.open(`/api/pdf?id=${inv.id}&mode=inline`, '_blank')}
                     className="p-2.5 bg-slate-950 hover:bg-blue-600/10 text-slate-600 hover:text-blue-400 rounded-xl border border-white/5 transition-all" 
                     title="Cetak"
                   >
                     <Printer className="w-4 h-4" />
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

                       fetch(`/api/pdf?id=${inv.id}&mode=attachment`)
                         .then(res => {
                           if (!res.ok) throw new Error("Gagal");
                           const contentDisposition = res.headers.get('Content-Disposition');
                           let filename = `Invoice_${inv.invoiceNumber}.pdf`;
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
                     className="p-2.5 bg-slate-950 hover:bg-indigo-600/10 text-slate-600 hover:text-indigo-400 rounded-xl border border-white/5 transition-all" 
                     title="Download PDF"
                   >
                     <Download className="w-4 h-4" />
                   </button>
                  <button onClick={() => router.push(`/invoice/edit/${inv.id}`)} className="p-2.5 bg-slate-950 hover:bg-indigo-600/10 text-slate-600 hover:text-indigo-400 rounded-xl border border-white/5 transition-all" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {(session?.user as any)?.role === "OWNER" && (
                    <button onClick={() => setDeleteId(inv.id)} className="p-2.5 bg-slate-950 hover:bg-red-600/10 text-slate-600 hover:text-red-500 rounded-xl border border-white/5 transition-all" title="Hapus">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modals */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-[32px] p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6"><Trash2 className="w-8 h-8 text-red-500" /></div>
            <h3 className="text-white font-black text-xl mb-2 italic">Hapus Invoice?</h3>
            <p className="text-slate-400 text-sm mb-8 font-medium">Tindakan ini permanen dan tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-4 rounded-2xl bg-slate-800 text-slate-300 font-black text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">Batal</button>
              <button onClick={handleDelete} className="flex-1 py-4 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-900/40">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {paymentInv && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-[40px] p-10 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-900/40"><Wallet className="w-6 h-6" /></div>
                  <div>
                    <h3 className="text-white font-black text-xl italic uppercase leading-none">Pembayaran</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1.5">{paymentInv.invoiceNumber}</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-950/50 rounded-3xl p-6 mb-8 border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500"><span>Total Tagihan</span><span className="text-white text-sm">{fmt(paymentInv.total)}</span></div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-emerald-500"><span>Sisa Piutang</span><span className="text-emerald-400 text-lg">{fmt(paymentInv.total)}</span></div>
              </div>
              <div className="space-y-4">
                <input type="number" value={newPaymentAmount} onChange={e => setNewPaymentAmount(e.target.value)} placeholder="Jumlah Bayar (Rp)..." className="w-full bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 text-white font-black text-lg outline-none focus:border-emerald-500 transition-all" />
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleQuickPayment(paymentInv, true)} className="py-4 rounded-2xl bg-emerald-600/10 text-emerald-400 font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all">Lunas</button>
                  <button onClick={() => handleQuickPayment(paymentInv, false)} disabled={!newPaymentAmount} className="py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs uppercase tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50">Bayar</button>
                </div>
                <button onClick={() => setPaymentInv(null)} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-slate-400">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Overlay */}
      <PrintingProgress isOpen={isGeneratingPDF} progress={printProgress} />

      {toast && (
        <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-[24px] shadow-2xl z-[150] flex items-center gap-4 animate-in fade-in slide-in-from-right-4 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-black uppercase tracking-widest">{toast.msg}</p>
        </div>
      )}
    </div>
  );
}
