"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  FileText, Plus, Trash2, Edit2, CheckCircle, 
  Clock, XCircle, ArrowLeft, Download, Save, X,
  Banknote, Check, Wallet, Info
} from "lucide-react";
import PrintingProgress from "@/components/PrintingProgress";
import InvoiceA4Preview from "@/components/InvoiceA4Preview";
import { getGlobalSettings } from "@/app/actions";
import { InvoiceData } from "@/lib/types";

interface InvoiceItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string | null;
  clientName: string;
  companyName?: string | null;
  clientAddress: string;
  subtotal: number;
  taxAmount: number;
  taxApplied: boolean;
  discountAmount: number;
  downPayment: number;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod: "CASH" | "CHEQUE" | "BILYET GIRO" | "TRANSFER";
  invoiceType: "DP" | "PELUNASAN";
  items: InvoiceItem[];
}

const emptyForm = () => ({
  id: "",
  invoiceNumber: `INV/${new Date().getFullYear()}/${String(Math.floor(Math.random() * 900) + 100)}`,
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  clientName: "",
  clientAddress: "",
  notes: "",
  taxApplied: false,
  discountAmount: 0,
  downPayment: 0,
  status: "PENDING" as const,
  paymentMethod: "CASH" as const,
  invoiceType: "PELUNASAN" as const,
  items: [{ description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }],
});

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const statusBadge = (s: string) => {
  if (s === "PAID") return { label: "Lunas", icon: CheckCircle, cls: "bg-emerald-100 text-emerald-700" };
  if (s === "CANCELLED") return { label: "Batal", icon: XCircle, cls: "bg-red-100 text-red-700" };
  return { label: "Pending", icon: Clock, cls: "bg-amber-100 text-amber-700" };
};

export default function InvoicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "form">("list");
  const [form, setForm] = useState<any>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [printProgress, setPrintProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPrintingRef = useRef(false);

  const [globalLogo, setGlobalLogo] = useState<string | null>(null);
  const [globalTTD, setGlobalTTD] = useState<string | null>(null);

  const [paymentInv, setPaymentInv] = useState<Invoice | null>(null);
  const [newPaymentAmount, setNewPaymentAmount] = useState<string>("");
  const [updatingPayment, setUpdatingPayment] = useState(false);

  const [clients, setClients] = useState<any[]>([]);
  const [showClients, setShowClients] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  const loadClients = async () => {
    setClientLoading(true);
    try {
      const res = await fetch("/api/clients/list");
      const d = await res.json();
      if (d.success) setClients(d.clients);
    } catch (e) { console.error(e); }
    setClientLoading(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
            setShowClients(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePickClient = (c: any) => {
    setForm(prev => ({
      ...prev,
      clientName: c.companyName || c.clientName,
      companyName: c.companyName,
      clientAddress: c.address
    }));
    setShowClients(false);
  };

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const showToast = useCallback((msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/invoice/list");
      const data = await res.json();
      if (data.success) setInvoices(data.invoices);
    } catch { showToast("Gagal memuat data", "error"); }
    setLoading(false);
  }, [showToast]);

  useEffect(() => { 
    if (status === "authenticated") {
      loadInvoices();
      
      // Load Global Settings
      getGlobalSettings().then(res => {
        if (res.success && 'data' in res) {
          const logo = res.data.find((s: any) => s.id === 'LOGO')?.value || null;
          const ttd = res.data.find((s: any) => s.id === 'TTD')?.value || null;
          setGlobalLogo(logo);
          setGlobalTTD(ttd);
        }
      });
    } 
  }, [status, loadInvoices]);

  const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) => {
    setForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: val };
      items[idx].lineTotal = items[idx].quantity * items[idx].unitPrice;
      return { ...f, items };
    });
  };

  const addItem = () =>
    setForm(f => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }] }));

  const removeItem = (idx: number) =>
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const subtotal = form.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const discount = Number(form.discountAmount) || 0;
  const dpp = subtotal - discount;
  const tax = form.taxApplied ? dpp * 0.11 : 0;
  const grandTotal = dpp + tax;
  const dp = Number(form.downPayment) || 0;
  const total = (form.invoiceType as string) === "DP" ? dp : (grandTotal - dp);
  const handleSave = async () => {
    if (!form.clientName.trim()) return showToast("Nama klien wajib diisi", "error");
    if (!form.invoiceNumber.trim()) return showToast("Nomor invoice wajib diisi", "error");
    setSaving(true);
    try {
      const res = await fetch("/api/invoice/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Invoice berhasil disimpan!");
        await loadInvoices();
        setView("list");
      } else {
        showToast(data.error || "Gagal menyimpan", "error");
      }
    } catch { showToast("Gagal menyimpan", "error"); }
    setSaving(false);
  };

  const handleEdit = (inv: Invoice) => {
    setForm({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      date: inv.date.slice(0, 10),
      dueDate: inv.dueDate?.slice(0, 10) ?? "",
      clientName: inv.clientName,
      clientAddress: inv.clientAddress,
      notes: "",
      taxApplied: false,
      discountAmount: Number(inv.discountAmount || 0),
      downPayment: Number(inv.downPayment || 0),
      status: inv.status,
      paymentMethod: inv.paymentMethod || "CASH",
      invoiceType: inv.invoiceType || "PELUNASAN",
      items: inv.items.map(i => ({ ...i, lineTotal: i.quantity * i.unitPrice })),
    });
    setView("form");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch("/api/invoice/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteId }),
      });
      showToast("Invoice dihapus");
      setDeleteId(null);
      loadInvoices();
    } catch { showToast("Gagal menghapus", "error"); }
  };

  const handleDownloadPDF = async (id: string, invoiceNumber: string, clientName?: string) => {
    if (isPrintingRef.current) return;
    
    isPrintingRef.current = true;
    setIsGeneratingPDF(true); 
    setPrintProgress(0);
    
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
    }

    progressIntervalRef.current = setInterval(() => {
        setPrintProgress(prev => {
            if (prev < 70) return prev + 2.5;
            if (prev < 85) return prev + 0.8;
            if (prev < 95) return prev + 0.2;
            if (prev < 99) return prev + 0.05;
            return prev;
        });
    }, 150);

    try {
      setPrintProgress(20);
      const response = await fetch(`/api/pdf?id=${id}`);
      if (!response.ok) throw new Error("Gagal generate PDF");
      
      setPrintProgress(100);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeInvoiceNumber = invoiceNumber.replace(/\//g, "-").replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-');
      const safeClientName = (clientName || form.companyName || form.clientName || 'Client')
          .replace(/[^\w\s-]/gi, '')
          .replace(/\s+/g, '_');
          
      a.download = `Invoice_${safeInvoiceNumber}_${safeClientName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast("PDF berhasil diunduh!");
      
      setTimeout(() => {
        setIsGeneratingPDF(false);
        setPrintProgress(0);
        isPrintingRef.current = false;
      }, 1000);
    } catch (error) {
      console.error(error);
      showToast("Gagal mengunduh PDF", "error");
      setIsGeneratingPDF(false);
      setPrintProgress(0);
      isPrintingRef.current = false;
    } finally {
      if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
      }
    }
  };

  const handleQuickPayment = async (inv: Invoice, isFull: boolean = false) => {
    setUpdatingPayment(true);
    try {
      const res = await fetch("/api/invoice/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          id: inv.id, 
          amount: isFull ? 0 : Number(newPaymentAmount), 
          isFullPayment: isFull 
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isFull ? "Invoice ditandai lunas" : "Pembayaran ditambahkan");
        setPaymentInv(null);
        setNewPaymentAmount("");
        loadInvoices();
      } else {
        showToast(data.error || "Gagal update pembayaran", "error");
      }
    } catch {
      showToast("Gagal update pembayaran", "error");
    }
    setUpdatingPayment(false);
  };

  if (status === "loading") return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (status === "unauthenticated") { router.push("/login"); return null; }

  return (
    <div className="min-h-screen bg-slate-950 font-sans">
      {/* Top Bar */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-black text-white">Invoice Generator</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">PT. Apindo Karya Lestari</p>
            </div>
          </div>
          {view === "list" ? (
            <button
              onClick={() => { setForm(emptyForm()); setView("form"); }}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-900/40"
            >
              <Plus className="w-4 h-4" /> Buat Invoice
            </button>
          ) : (
            <button
              onClick={() => setView("list")}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              <X className="w-4 h-4" /> Batal
            </button>
          )}
        </div>
      </div>

      <PrintingProgress 
          isOpen={isGeneratingPDF}
          progress={printProgress}
      />

      <div className={`${view === "list" ? "max-w-6xl mx-auto px-4" : "max-w-[1800px] mx-auto px-0 lg:px-6"} py-8`}>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-20 right-4 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl transition-all ${
            toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Delete Modal */}
        {deleteId && (
          <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 max-w-sm w-full text-center">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-white font-black text-lg mb-2">Hapus Invoice?</h3>
              <p className="text-slate-400 text-sm mb-6">Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm hover:bg-slate-700 transition-all">Batal</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-500 transition-all">Hapus</button>
              </div>
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-black text-white">Daftar Invoice</h2>
              <p className="text-slate-400 text-sm mt-1">{invoices.length} invoice ditemukan</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-24 text-slate-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="font-bold text-lg text-slate-400">Belum ada invoice</p>
                <p className="text-sm mt-1">Klik "Buat Invoice" untuk membuat invoice pertama</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map(inv => {
                  const badge = statusBadge(inv.status);
                  const BadgeIcon = badge.icon;
                  
                  const totalProject = (Number(inv.subtotal) || 0) - (Number(inv.discountAmount) || 0) + (Number(inv.taxAmount) || 0);
                  const paidAmount = Number(inv.downPayment) || 0;
                  const progressPercent = Math.min(100, Math.round((paidAmount / totalProject) * 100)) || 0;
                  
                  return (
                    <div key={inv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 hover:border-slate-700 transition-all group relative overflow-hidden">
                      {/* Progress Line Background */}
                      <div className="absolute bottom-0 left-0 h-1 bg-slate-800 w-full">
                        <div 
                          className={`h-full transition-all duration-1000 ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-white font-black text-base">{inv.invoiceNumber}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badge.cls}`}>
                            <BadgeIcon className="w-3 h-3" /> {badge.label}
                          </span>
                          {inv.status !== 'PAID' && progressPercent > 0 && (
                            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                              Dibayar {progressPercent}%
                            </span>
                          )}
                        </div>
                        <p className="text-slate-300 font-semibold text-sm">{inv.clientName}</p>
                        <div className="flex items-center gap-4 mt-1">
                           <p className="text-slate-500 text-xs">{new Date(inv.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
                           <div className="flex items-center gap-1 text-slate-500 text-[10px] font-bold uppercase tracking-tighter">
                             <Info className="w-3 h-3" />
                             {inv.invoiceType === 'DP' ? 'Tagihan DP' : 'Tagihan Pelunasan'}
                           </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-emerald-400 font-black text-lg">{fmt(inv.total)}</p>
                        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                          {inv.invoiceType === 'DP' ? 'Nilai DP' : 'Sisa Tagihan'}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {inv.status !== 'PAID' && (
                          <>
                            <button 
                              onClick={() => setPaymentInv(inv)}
                              className="p-2.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl transition-all" 
                              title="Update Pembayaran"
                            >
                              <Banknote className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleQuickPayment(inv, true)}
                              className="p-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-xl transition-all" 
                              title="Tandai Lunas"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDownloadPDF(inv.id!, inv.invoiceNumber, inv.companyName || inv.clientName)} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all" title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(inv)} className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(inv.id)} className="p-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl transition-all" title="Hapus">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {paymentInv && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-[32px] p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
               {/* Background Glow */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-black text-xl leading-none">Bayar Tagihan</h3>
                      <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-widest">{paymentInv.invoiceNumber}</p>
                    </div>
                  </div>
                  <button onClick={() => setPaymentInv(null)} className="p-2 text-slate-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-5 mb-6 border border-slate-700/50">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Total Nilai Proyek</span>
                      <span className="text-white font-black">{fmt((Number(paymentInv.subtotal) || 0) - (Number(paymentInv.discountAmount) || 0) + (Number(paymentInv.taxAmount) || 0))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Sudah Dibayar</span>
                      <span className="text-emerald-400 font-black">{fmt(Number(paymentInv.downPayment) || 0)}</span>
                    </div>
                    <div className="pt-3 border-t border-slate-700 flex justify-between items-center">
                      <span className="text-white text-xs font-black uppercase tracking-widest">Sisa Tagihan</span>
                      <span className="text-blue-400 font-black text-lg">{fmt(Math.max(0, ((Number(paymentInv.subtotal) || 0) - (Number(paymentInv.discountAmount) || 0) + (Number(paymentInv.taxAmount) || 0)) - (Number(paymentInv.downPayment) || 0)))}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">Masukkan Pembayaran Baru (Rp)</label>
                    <input 
                      type="number"
                      value={newPaymentAmount}
                      onChange={(e) => setNewPaymentAmount(e.target.value)}
                      placeholder="Contoh: 2000000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-white font-black text-lg outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button 
                      onClick={() => handleQuickPayment(paymentInv, true)}
                      disabled={updatingPayment}
                      className="py-4 rounded-2xl bg-emerald-600/10 text-emerald-400 font-black text-xs uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" /> Lunas
                    </button>
                    <button 
                      onClick={() => handleQuickPayment(paymentInv, false)}
                      disabled={updatingPayment || !newPaymentAmount}
                      className="py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updatingPayment ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <><Save className="w-4 h-4" /> Tambah</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FORM VIEW */}
        {view === "form" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start h-[calc(100vh-160px)]">
            {/* LEFT: FORM Editor */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 h-full overflow-y-auto pr-2 custom-scrollbar pb-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Editor Kwitansi</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Workbench v1.0</p>
                </div>
              </div>

              {/* Header Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Nomor Invoice *</label>
                    <input
                      value={form.invoiceNumber}
                      onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Jenis Tagihan</label>
                    <select
                      value={form.invoiceType}
                      onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value as any }))}
                      className="w-full bg-blue-900/50 border border-blue-800/50 text-blue-300 rounded-xl px-3 py-2.5 font-bold text-xs outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="PELUNASAN">Pelunasan / Tagihan Penuh</option>
                      <option value="DP">Tagihan Uang Muka (DP)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PAID">Lunas</option>
                      <option value="CANCELLED">Dibatalkan</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Tanggal Invoice</label>
                    <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Jatuh Tempo</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none focus:border-blue-500 transition-colors" />
                  </div>
                </div>

                <div className="relative" ref={clientDropdownRef}>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nama Klien *</label>
                    <button 
                      onClick={() => {
                        setShowClients(!showClients);
                        if (clients.length === 0) loadClients();
                      }}
                      className="text-[9px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-tighter flex items-center gap-1"
                    >
                      <Database className="w-2.5 h-2.5" />
                      Database
                    </button>
                  </div>
                  <input 
                    value={form.clientName} 
                    onFocus={() => {
                        setShowClients(true);
                        if (clients.length === 0) loadClients();
                    }}
                    onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    placeholder="PT. Nama Perusahaan..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600" 
                  />

                  {showClients && clients.length > 0 && (
                    <div className="absolute z-[60] w-full mt-2 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 mb-1 border-b border-slate-800 flex justify-between items-center">
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pilih Klien Terdaftar</p>
                            {clientLoading && <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-500" />}
                        </div>
                        <div className="space-y-1">
                            {clients.filter(c => 
                                !form.clientName || 
                                (c.companyName || "").toLowerCase().includes(form.clientName.toLowerCase()) ||
                                (c.clientName || "").toLowerCase().includes(form.clientName.toLowerCase())
                            ).map((c, i) => (
                                <div 
                                    key={i} 
                                    onClick={() => handlePickClient(c)}
                                    className="p-3 hover:bg-blue-600 group rounded-xl cursor-pointer transition-all border border-transparent hover:border-blue-500"
                                >
                                    <p className="text-xs font-black text-white group-hover:text-white">{c.companyName || c.clientName}</p>
                                    <p className="text-[10px] text-slate-400 group-hover:text-blue-100 truncate">{c.address}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Alamat Klien</label>
                  <input value={form.clientAddress} onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))}
                    placeholder="Jl. Contoh No. 1..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600" />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Metode Pembayaran</label>
                  <select
                    value={form.paymentMethod}
                    onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value as any }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="CASH">CASH</option>
                    <option value="CHEQUE">CHEQUE</option>
                    <option value="BILYET GIRO">BILYET GIRO</option>
                    <option value="TRANSFER">TRANSFER</option>
                  </select>
                </div>
              </div>

              {/* Items */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-black text-sm">Item Pekerjaan</h3>
                  <button onClick={addItem} className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-widest">
                    <Plus className="w-3.5 h-3.5" /> Tambah Item
                  </button>
                </div>

                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-2 relative group">
                      <div className="flex gap-2">
                        <input
                          value={item.description}
                          onChange={e => updateItem(idx, "description", e.target.value)}
                          placeholder="Deskripsi pekerjaan..."
                          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
                        />
                        {form.items.length > 1 && (
                          <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-red-400 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Qty:</span>
                          <input
                            type="number" min="1" value={item.quantity}
                            onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs text-center outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Harga:</span>
                          <input
                            type="number" min="0" value={item.unitPrice}
                            onChange={e => updateItem(idx, "unitPrice", Number(e.target.value))}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-white text-xs text-right outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">Catatan</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Catatan tambahan..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600 resize-none" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.taxApplied}
                    onChange={e => setForm(f => ({ ...f, taxApplied: e.target.checked }))}
                    className="w-4 h-4 accent-blue-500" />
                  <span className="text-xs text-slate-300 font-bold">Kenakan PPN 11%</span>
                </label>

                <div className="space-y-2 bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                  <div className="flex justify-between text-[11px] items-center">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Diskon</span>
                    <input type="number" min="0" value={form.discountAmount}
                      onChange={e => setForm(f => ({ ...f, discountAmount: Number(e.target.value) }))}
                      className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs text-right outline-none focus:border-blue-500 transition-colors" />
                  </div>
                  {form.taxApplied && (
                    <div className="flex justify-between text-[11px] items-center py-1">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">DPP</span>
                      <span className="text-white font-semibold">{fmt(dpp)}</span>
                    </div>
                  )}
                  {form.taxApplied && (
                    <div className="flex justify-between text-[11px] items-center py-1">
                      <span className="text-slate-500 font-bold uppercase tracking-widest">PPN 11%</span>
                      <span className="text-white font-semibold">{fmt(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] items-center py-1">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Grand Total</span>
                    <span className="text-white font-semibold">{fmt(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] items-center border-t border-slate-700/50 pt-2">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">
                      {form.invoiceType === "DP" ? "Besar Uang Muka (DP)" : "Uang Muka (DP)"}
                    </span>
                    <input type="number" min="0" value={form.downPayment}
                      onChange={e => setForm(f => ({ ...f, downPayment: Number(e.target.value) }))}
                      className={`w-28 bg-slate-800 border rounded-lg px-2 py-1 text-white text-xs text-right outline-none focus:border-blue-500 transition-colors ${form.invoiceType === "DP" ? "border-blue-500 bg-blue-900/20" : "border-slate-700"}`} />
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex justify-between items-center">
                    <span className="text-white font-black text-xs uppercase tracking-widest">
                      {form.invoiceType === "DP" ? "Total Tagihan DP" : "Sisa Tagihan"}
                    </span>
                    <span className="text-emerald-400 font-black text-base">{fmt(total)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Save className="w-4 h-4" /> Simpan Data</>
                  )}
                </button>

                {form.id && (
                  <button
                    onClick={() => handleDownloadPDF(form.id!, form.invoiceNumber, form.companyName || form.clientName)}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT: LIVE PREVIEW Studio */}
            <div className="lg:col-span-7 xl:col-span-8 bg-slate-900/40 rounded-[32px] border border-slate-800 p-8 h-full overflow-hidden relative">
              <div className="absolute top-6 left-6 z-30">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 backdrop-blur-md rounded-full shadow-sm border border-slate-700">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Live Studio Preview</span>
                </div>
              </div>

              <div className="w-full h-full overflow-y-auto custom-scrollbar flex justify-center items-start pt-10">
                <div className="transform scale-[0.85] origin-top bg-white shadow-2xl rounded-sm">
                  <InvoiceA4Preview
                    data={{
                      ...form,
                      items: form.items.map((it, i) => ({
                        id: String(i),
                        description: it.description,
                        quantity: it.quantity,
                        unitPrice: it.unitPrice
                      })),
                      subtotal,
                      taxAmount: tax,
                      total,
                    } as InvoiceData}
                    isGeneratingPDF={false}
                    globalLogoUrl={globalLogo}
                    globalTTDUrl={globalTTD}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
