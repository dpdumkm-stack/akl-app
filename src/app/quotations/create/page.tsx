"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QuotationData } from "@/lib/types";
import { getUniqueId, formatQuotationNumber } from "@/lib/utils";
import FormEditor from "@/components/FormEditor";
import A4Preview from "@/components/A4Preview";
import PrintingProgress from "@/components/PrintingProgress";
import DocumentPreviewStudio from "@/components/editor/DocumentPreviewStudio";
import { AlertCircle, FileText, ArrowLeft, Save, LayoutDashboard, Eye, Edit3, RefreshCw, Copy, Check } from "lucide-react";

const emptyQuotation = (): QuotationData => ({
  nomorSurat: formatQuotationNumber(0),
  tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  namaKlien: "",
  up: "",
  lokasi: "",
  items: [
    { id: getUniqueId(), deskripsi: "", volume: 0, satuan: "m2", harga: 0, hargaBahan: 0, hargaJasa: 0, bahan: "" }
  ],
  diskon: 0,
  kenakanPPN: false,
  isJasaBahanMode: false,
  isMaterialOnlyMode: false,
  isHargaSatuanMode: false,
  showLingkupKerja: true,
  lingkupKerja: ["Persiapan area kerja & Grinding permukaan lantai untuk membuka pori-pori beton.", "Pembersihan debu sisa grinding menggunakan mesin Vacuum Industry.", "Aplikasi Epoxy Primer (Lapis Dasar Pengikat).", "Aplikasi Epoxy Plamir / Body Coat (Menutup retak rambut & meratakan permukaan)", "Aplikasi Epoxy Top Coat (Lapis Akhir / Finishing Warna).", "Pembersihan area material & Serah terima pekerjaan (BAST)."],
  showSyaratGaransi: true,
  syaratGaransi: ["Garansi pemeliharaan selama 1 (Satu) Tahun terhitung sejak tanggal BAST.", "Klaim garansi berlaku untuk: Cat Mengelupas, Blistering (Gelembung), dan Defect Material.", "Garansi gugur apabila kerusakan disebabkan oleh Force Majeure, pergeseran struktur, atau kelalaian pemakaian.", "Pihak klien wajib mengkondisikan area kerja bebas dari debu, air, and aktivitas pihak lain selama masa aplikasi.", "Standar kadar beton yang layak minimal K-225, usia curing minimal 28 hari, dan kering (Moisture < 5%)."],
  showTermin: true,
  termin: ["DP 30% Setelah SPK diterbitkan / Sebelum Material Onsite.", "Progres 60% Setelah aplikasi Body Coat selesai.", "Pelunasan 10% Setelah pekerjaan selesai (BAST)."],
  namaPenandatangan: "MUDINI NURAFIN",
  jabatanPenandatangan: "PRINSIPAL",
  phonePenandatangan: "0812-1910-3195",
  ttdStempelUrl: "",
  logoUrl: ""
});

export default function CreateQuotationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<QuotationData>(emptyQuotation());
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [printProgress, setPrintProgress] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === 'error' ? 10000 : 3000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { saveQuotation } = await import("@/app/actions");
      const subTotal = (data.items || []).reduce((acc, i) => {
          const hBahan = Number(i.hargaBahan) || 0;
          const hJasa = Number(i.hargaJasa) || 0;
          const hSatuan = Number(i.harga) || 0;
          const vol = Number(i.volume) || 0;
          let price = data.isMaterialOnlyMode ? hBahan : (data.isJasaBahanMode ? (hBahan + hJasa) : hSatuan);
          return acc + (vol * price);
      }, 0);
      const total = subTotal - Number(data.diskon || 0) + (data.kenakanPPN ? (subTotal - Number(data.diskon || 0)) * 0.11 : 0);
      
      const res = await saveQuotation(data, total);
      if (res.success) {
        showToast("Quotation berhasil disimpan!");
        router.push("/quotations");
      } else {
        showToast(res.message, "error");
      }
    } catch (err) { showToast("Terjadi kesalahan sistem", "error"); }
    setIsSaving(false);
  };

  const handleGeneratePDF = async () => {
    setIsSaving(true);
    try {
      const { saveQuotation } = await import("@/app/actions");
      const subTotal = (data.items || []).reduce((acc, i) => {
          const hBahan = Number(i.hargaBahan) || 0;
          const hJasa = Number(i.hargaJasa) || 0;
          const hSatuan = Number(i.harga) || 0;
          const vol = Number(i.volume) || 0;
          let price = data.isMaterialOnlyMode ? hBahan : (data.isJasaBahanMode ? (hBahan + hJasa) : hSatuan);
          return acc + (vol * price);
      }, 0);
      const total = subTotal - Number(data.diskon || 0) + (data.kenakanPPN ? (subTotal - Number(data.diskon || 0)) * 0.11 : 0);
      
      const res = await saveQuotation(data, total);
      if (res.success) {
        showToast("Menyiapkan PDF...");
        window.open(`/api/pdf?id=${data.id}&mode=attachment`, '_blank');
      } else {
        showToast(res.message, "error");
      }
    } catch (err) { showToast("Gagal memproses PDF", "error"); }
    setIsSaving(false);
  };

  if (status === "loading") return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black animate-pulse text-slate-400">LOADING...</div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* Header */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-white/5 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/quotations")} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>
            <div>
              <h1 className="text-lg font-black text-white leading-tight flex items-center gap-2 italic uppercase">
                <FileText className="w-5 h-5 text-blue-500" />
                Buat Penawaran Baru
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Studio Drafting v3.0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 border border-white/5"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
             <button 
                onClick={handleSave} disabled={isSaving}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Penawaran
              </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1800px] mx-auto px-4 lg:px-6 py-4 lg:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
           {/* Editor */}
           <div className={`space-y-6 h-[calc(100vh-140px)] overflow-y-auto pr-2 custom-scrollbar pb-10 ${viewMode === 'preview' ? 'hidden lg:block' : 'block'}`}>
                <FormEditor 
                  data={data} 
                  setData={setData} 
                  onSave={handleSave}
                  onDownloadPDF={handleGeneratePDF}
                  showToast={showToast}
                  setConfirmModal={setConfirmModal}
                  globalLogoUrl={data.logoUrl}
                  globalTTDUrl={data.ttdStempelUrl}
                  isSaving={isSaving}
                  isGeneratingPDF={isGeneratingPDF}
               />
            </div>
           
           {/* Studio Preview */}
           <div className={`h-[calc(100vh-140px)] ${viewMode === 'edit' ? 'hidden lg:block' : 'block'}`}>
              <DocumentPreviewStudio title="Quotation Preview" initialZoom={0.75}>
                  <A4Preview 
                    data={data} 
                    isGeneratingPDF={false} 
                  />
              </DocumentPreviewStudio>
           </div>
        </div>
      </main>

      {/* Mobile Toggle */}
      <button 
        onClick={() => setViewMode(viewMode === 'edit' ? 'preview' : 'edit')}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center z-[60] active:scale-90 transition-transform"
      >
        {viewMode === 'edit' ? <Eye className="w-6 h-6" /> : <Edit3 className="w-6 h-6" />}
      </button>

      {toast && (
        <div className={`fixed bottom-8 right-8 pl-8 pr-6 py-5 rounded-[24px] shadow-2xl z-[100] flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white border border-white/20 backdrop-blur-md`}>
          {toast.type === 'success' ? <FileText className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <div className="flex flex-col">
            <p className="text-sm font-black uppercase tracking-widest select-text">{toast.msg}</p>
            {toast.type === 'error' && (
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(toast.msg);
                  showToast("Pesan error berhasil disalin!", "success");
                }}
                className="mt-2 text-[9px] font-black uppercase tracking-widest bg-black/20 hover:bg-black/40 py-1.5 px-3 rounded-lg flex items-center gap-2 self-start transition-all"
              >
                <Copy className="w-3 h-3" /> Salin Pesan Error
              </button>
            )}
          </div>
          <button onClick={() => setToast(null)} className="ml-4 p-1 hover:bg-white/10 rounded-full">
            <RefreshCw className="w-3 h-3 rotate-45" />
          </button>
        </div>
      )}

      {/* Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/5 rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 text-center">
            <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight italic">{confirmModal.title}</h3>
            <p className="text-slate-400 text-sm mb-8 font-medium leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">Batal</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>{confirmModal.confirmText || 'Konfirmasi'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
