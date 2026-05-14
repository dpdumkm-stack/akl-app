"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Plus, X, Search, Database, 
  RefreshCw, AlertCircle, Trash2, Eye, Edit3
} from "lucide-react";
import { saveInvoice } from "@/app/actions";
import InvoiceA4Preview from "@/components/InvoiceA4Preview";
import DocumentPreviewStudio from "@/components/editor/DocumentPreviewStudio";
import OtorisasiSection from "@/components/editor/OtorisasiSection";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<{ logo: string | null, ttd: string | null }>({ logo: null, ttd: null });

  const loadInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoice/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const d = await res.json();
        if (d.success) setForm(d.invoice);
        else {
          showToast("Invoice tidak ditemukan", "error");
          setTimeout(() => router.push("/invoice"), 2000);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    if (status === "authenticated") loadInvoice();
    const fetchSettings = async () => {
        const { getGlobalSettings } = await import("@/app/actions");
        const res = await getGlobalSettings();
        if (res.success && 'data' in res) {
            const logo = res.data.find((s: any) => s.id === 'LOGO')?.value || null;
            const ttd = res.data.find((s: any) => s.id === 'TTD')?.value || null;
            setGlobalSettings({ logo, ttd });
        }
    };
    fetchSettings();
  }, [status, loadInvoice]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    if (!form.clientName || form.items.length === 0) return showToast("Mohon lengkapi data", "error");
    setSaving(true);
    try {
      const subtotal = form.items.reduce((sum: number, it: any) => sum + (it.quantity * it.unitPrice), 0);
      const dpp = subtotal - (form.discountAmount || 0);
      const taxAmount = form.taxApplied ? Math.round(dpp * 0.11) : 0;
      const grandTotal = dpp + taxAmount;
      const total = form.invoiceType === "DP" ? (form.downPayment || 0) : (grandTotal - (form.downPayment || 0));

      const payload = { ...form, subtotal, taxAmount, total };
      const res = await saveInvoice(payload);
      if (res.success) {
        showToast("Perubahan disimpan");
        setTimeout(() => router.push("/invoice"), 1000);
      } else {
        showToast(res.message || "Gagal menyimpan", "error");
      }
    } catch { showToast("Gagal menyimpan", "error"); }
    setSaving(false);
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setForm((f: any) => ({ ...f, [field]: reader.result as string }));
        reader.readAsDataURL(file);
    }
  };

  if (status === "loading" || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-black animate-pulse text-slate-400 uppercase italic tracking-widest">Loading Invoicing Studio...</div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }
  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/invoice")} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-sm font-black text-white uppercase italic">Edit Invoice</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{form.invoiceNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={handleSave} disabled={saving}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Perubahan
              </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Editor */}
          <div className={`space-y-6 h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar pb-10 ${viewMode === 'preview' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl">
               <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nomor Invoice</label>
                  <input value={form.invoiceNumber} onChange={e => setForm((f: any) => ({ ...f, invoiceNumber: e.target.value }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Jenis Tagihan</label>
                  <select value={form.invoiceType} onChange={e => setForm((f: any) => ({ ...f, invoiceType: e.target.value as any }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50">
                    <option value="PELUNASAN">Tagihan Penuh / Pelunasan</option>
                    <option value="DP">Tagihan Uang Muka (DP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm((f: any) => ({ ...f, date: e.target.value }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Jatuh Tempo</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm((f: any) => ({ ...f, dueDate: e.target.value }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block mb-2">Nama Klien / Perusahaan</label>
                <input value={form.clientName} onChange={e => setForm((f: any) => ({ ...f, clientName: e.target.value }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Alamat Penagihan</label>
                <textarea value={form.clientAddress} onChange={e => setForm((f: any) => ({ ...f, clientAddress: e.target.value }))} rows={2} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-medium text-sm outline-none resize-none" />
              </div>
            </div>

            <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 italic">Rincian Tagihan</h2>
                </div>
                <button onClick={() => setForm((f: any) => ({ ...f, items: [...f.items, { description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }] }))} className="text-[10px] font-black text-emerald-400 hover:text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Tambah Baris
                </button>
              </div>

              <div className="space-y-4">
                {form.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-white/5 p-5 rounded-3xl space-y-4 relative group">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Deskripsi</label>
                        <input value={item.description} onChange={e => {
                          const newItems = [...form.items];
                          newItems[idx].description = e.target.value;
                          setForm((f: any) => ({ ...f, items: newItems }));
                        }} placeholder="Nama pekerjaan / barang..." className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs outline-none focus:border-emerald-500/50 transition-all" />
                      </div>
                      <button onClick={() => setForm((f: any) => ({ ...f, items: f.items.filter((_: any, i: number) => i !== idx) }))} className="mt-6 p-2.5 text-slate-700 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center block">Kuantitas</label>
                        <input type="number" min="1" value={item.quantity} onChange={e => {
                          const newItems = [...form.items];
                          newItems[idx].quantity = Number(e.target.value);
                          setForm((f: any) => ({ ...f, items: newItems }));
                        }} className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs text-center outline-none focus:border-emerald-500/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-right block">Harga Satuan</label>
                        <input type="number" min="0" value={item.unitPrice} onChange={e => {
                          const newItems = [...form.items];
                          newItems[idx].unitPrice = Number(e.target.value);
                          setForm((f: any) => ({ ...f, items: newItems }));
                        }} className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs text-right outline-none focus:border-emerald-500/50" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

              <OtorisasiSection 
                data={form} 
                setData={setForm} 
                onFileUpload={onFileUpload} 
                showToast={showToast} 
                setConfirmModal={setConfirmModal}
              />
            </div>

            {/* Studio Preview */}
            <div className={`h-[calc(100vh-140px)] ${viewMode === 'edit' ? 'hidden lg:block' : 'block'}`}>
                <DocumentPreviewStudio title="Invoice Studio" initialZoom={0.75}>
                    <InvoiceA4Preview 
                        data={form} 
                        isGeneratingPDF={false} 
                        globalLogoUrl={globalSettings.logo}
                        globalTTDUrl={globalSettings.ttd}
                    />
                </DocumentPreviewStudio>
            </div>
          </div>
        </main>

        {/* Mobile Toggle */}
        <button 
          onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[60] active:scale-90 transition-transform"
        >
          {viewMode === 'edit' ? <Eye className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
        </button>

        {toast && (
          <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-[24px] shadow-2xl z-[150] flex items-center gap-4 animate-in fade-in slide-in-from-right-4 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-black uppercase tracking-widest">{toast.msg}</p>
          </div>
        )}
      </div>
  );
}
