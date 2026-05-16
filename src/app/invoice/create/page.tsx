"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, X, Search, Database, 
  TrendingUp, RefreshCw, AlertCircle, Receipt, Eye, Edit3
} from "lucide-react";
import { saveInvoice, getInvoiceNumberAction } from "@/app/actions";
import InvoiceA4Preview from "@/components/InvoiceA4Preview";
import DocumentPreviewStudio from "@/components/editor/DocumentPreviewStudio";
import OtorisasiSection from "@/components/editor/OtorisasiSection";
import { formatInvoiceNumber } from "@/lib/utils";
import TextEditorTrigger from "@/components/TextEditorTrigger";

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const emptyForm = () => ({
  id: "",
  invoiceNumber: "",
  nomorUrut: 0,
  date: new Date().toISOString().slice(0, 10),
  dueDate: "",
  clientName: "",
  clientAddress: "",
  notes: "",
  taxApplied: false,
  discountAmount: 0,
  downPayment: 0,
  status: "PENDING" as const,
  paymentMethod: "TRANSFER" as const,
  invoiceType: "PELUNASAN" as const,
  items: [{ description: "", quantity: 1, unitPrice: 0, lineTotal: 0 }],
  namaPenandatangan: "MUDINI NURAFIN",
  jabatanPenandatangan: "PRINSIPAL",
  phonePenandatangan: "",
  ttdStempelUrl: "",
});

export default function CreateInvoicePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form, setForm] = useState<any>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [showClients, setShowClients] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const clientDropdownRef = useRef<HTMLDivElement>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<{ logo: string | null, ttd: string | null }>({ logo: null, ttd: null });

  useEffect(() => {
    const fetchNextNum = async () => {
      const res = await getInvoiceNumberAction();
      if (res.success) {
        setForm(f => ({ ...f, invoiceNumber: res.invoiceNumber, nomorUrut: res.nextUrut }));
      }
    };
    const fetchSettings = async () => {
        const { getGlobalSettings } = await import("@/app/actions");
        const res = await getGlobalSettings();
        if (res.success && 'data' in res) {
            const logo = res.data.find((s: any) => s.id.toUpperCase() === 'LOGO')?.value || null;
            const ttd = res.data.find((s: any) => s.id.toUpperCase() === 'TTD')?.value || null;
            setGlobalSettings({ logo, ttd });
        }
    };
    fetchNextNum();
    fetchSettings();
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePickClient = (c: any) => {
    setForm(f => ({ ...f, clientName: c.companyName || c.clientName, clientAddress: c.address }));
    setShowClients(false);
  };

  const calculateSubtotal = () => form.items.reduce((sum: number, it: any) => sum + (it.quantity * it.unitPrice), 0);
  const subtotal = calculateSubtotal();
  const dpp = subtotal - (form.discountAmount || 0);
  const tax = form.taxApplied ? Math.round(dpp * 0.11) : 0;
  const grandTotal = dpp + tax;
  const total = form.invoiceType === "DP" ? (form.downPayment || 0) : (grandTotal - (form.downPayment || 0));

  const handleSave = async () => {
    if (!form.clientName || form.items.length === 0) return showToast("Mohon lengkapi data", "error");
    setSaving(true);
    try {
      const payload = { ...form, subtotal, taxAmount: tax, total };
      const res = await saveInvoice(payload);
      if (res.success) {
        showToast("Invoice berhasil disimpan");
        router.push("/invoice");
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

  if (status === "loading") return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/invoice")} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-sm font-black text-white uppercase italic">Buat Invoice Baru</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Studio Invoicing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={handleSave} disabled={saving}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Invoice
              </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Editor */}
          <div className={`space-y-6 h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar pb-10 ${viewMode === 'preview' ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 space-y-6 shadow-2xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">No. Urut</label>
                  <input 
                    type="number" 
                    value={form.nomorUrut} 
                    onChange={e => {
                        const val = Number(e.target.value) || 1;
                        setForm(f => ({ ...f, nomorUrut: val, invoiceNumber: formatInvoiceNumber(val, new Date(f.date)) }));
                    }} 
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-emerald-500 font-bold text-sm outline-none focus:border-emerald-500/50" 
                  />
                </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nomor Invoice (Editable)</label>
                  <input value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Jenis Tagihan</label>
                  <select value={form.invoiceType} onChange={e => setForm(f => ({ ...f, invoiceType: e.target.value as any }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50">
                    <option value="PELUNASAN">Tagihan Penuh / Pelunasan</option>
                    <option value="DP">Tagihan Uang Muka (DP)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tanggal</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Jatuh Tempo</label>
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              <div className="relative">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 block mb-2">Nama Klien / Perusahaan</label>
                <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} className="w-full bg-slate-950 border border-white/5 rounded-2xl px-5 py-3 text-white font-bold text-sm outline-none focus:border-emerald-500/50" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Alamat Penagihan</label>
                <TextEditorTrigger
                  value={form.clientAddress}
                  onChange={(val) => setForm((f: any) => ({ ...f, clientAddress: val }))}
                  title="Alamat Penagihan"
                  placeholder="Alamat lengkap klien / perusahaan..."
                  accentColor="emerald"
                />
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
                globalLogoUrl={globalSettings.logo}
                globalTTDUrl={globalSettings.ttd}
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
