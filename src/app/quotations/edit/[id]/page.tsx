"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QuotationData } from "@/lib/types";
import FormEditor from "@/components/FormEditor";
import A4Preview from "@/components/A4Preview";
import PrintingProgress from "@/components/PrintingProgress";
import DocumentPreviewStudio from "@/components/editor/DocumentPreviewStudio";
import { AlertCircle, ArrowLeft, Save, LayoutDashboard, RefreshCw, Eye, Edit3, FileText, Copy } from "lucide-react";
import { saveQuotation } from "@/app/actions";

export default function EditQuotationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [printProgress, setPrintProgress] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [data, setData] = useState<QuotationData | null>(null);
  const [mounted, setMounted] = useState(false);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), type === 'error' ? 10000 : 3000);
  }, []);

  const loadQuotation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const d = await res.json();
        if (d.success) {
          const q = d.quotation;
          if (typeof q.termin === 'string') q.termin = JSON.parse(q.termin);
          if (typeof q.lingkupKerja === 'string') q.lingkupKerja = JSON.parse(q.lingkupKerja);
          if (typeof q.syaratGaransi === 'string') q.syaratGaransi = JSON.parse(q.syaratGaransi);
          setData(q);
        } else {
          showToast("Data tidak ditemukan", "error");
          setTimeout(() => router.push("/quotations"), 2000);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [id, router, showToast]);

  useEffect(() => {
    setMounted(true);
    if (status === "authenticated") loadQuotation();
  }, [status, loadQuotation]);

  const handleSave = async () => {
    if (!data) return;
    setIsSaving(true);
    try {
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
        showToast("Perubahan berhasil disimpan!");
        setTimeout(() => router.push("/quotations"), 1000);
      } else {
        showToast(res.message, "error");
      }
    } catch(err) { showToast("Terjadi kesalahan", "error"); }
    setIsSaving(false);
  };

  const handleGeneratePDF = async () => {
    if (!data) return;
    setIsGeneratingPDF(true);
    setPrintProgress(0);
    
    // Simulate progress while calling API
    const progressInterval = setInterval(() => {
      setPrintProgress(prev => {
        if (prev >= 99.5) return 99.5;
        // Distribute progress more evenly:
        // 0-70: +2.5
        // 70-90: +1.0
        // 90-95: +0.5
        // 95-99.5: +0.15 (steady but slow)
        const diff = prev < 70 ? 2.5 : prev < 90 ? 1.0 : prev < 95 ? 0.5 : 0.15;
        return prev + diff;
      });
    }, 150);

    try {
      const subTotal = (data.items || []).reduce((acc, i) => {
          const hBahan = Number(i.hargaBahan) || 0;
          const hJasa = Number(i.hargaJasa) || 0;
          const hSatuan = Number(i.harga) || 0;
          const vol = Number(i.volume) || 0;
          let price = data.isMaterialOnlyMode ? hBahan : (data.isJasaBahanMode ? (hBahan + hJasa) : hSatuan);
          return acc + (vol * price);
      }, 0);
      const total = subTotal - Number(data.diskon || 0) + (data.kenakanPPN ? (subTotal - Number(data.diskon || 0)) * 0.11 : 0);

      const saveRes = await saveQuotation(data, total);
      if (saveRes.success) {
        // Fetch the PDF blob
        const pdfRes = await fetch(`/api/pdf?id=${data.id}&mode=attachment`);
        if (!pdfRes.ok) throw new Error("Gagal mengunduh PDF dari server");
        
        const blob = await pdfRes.blob();
        
        // Complete the progress
        clearInterval(progressInterval);
        setPrintProgress(100);
        
        // Trigger download immediately without waiting
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const contentDisposition = pdfRes.headers.get('Content-Disposition');
        let filename = `Dokumen_${data.nomorSurat}.pdf`;
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="(.+)"/);
          if (match) filename = match[1];
        }
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        // Short delay only for closing the modal so user sees success mark
        setTimeout(() => {
          setIsGeneratingPDF(false);
          setPrintProgress(0);
        }, 600);
      } else {
        clearInterval(progressInterval);
        setIsGeneratingPDF(false);
        showToast(saveRes.message, "error");
      }
    } catch(err: any) { 
      clearInterval(progressInterval);
      setIsGeneratingPDF(false);
      showToast(err.message || "Gagal memproses PDF", "error"); 
    }
  };

  if (!mounted || status === "loading" || loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center font-black animate-pulse text-slate-400 uppercase italic tracking-widest">Loading Studio...</div>;
  if (status === "unauthenticated") { router.push("/login"); return null; }
  if (!data) return null;

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
              <h1 className="text-lg font-black text-white leading-tight uppercase italic">
                Edit Penawaran
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">{data.nomorSurat}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => router.push("/dashboard")}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all border border-white/5 flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </button>
             <button 
                onClick={handleSave} disabled={isSaving}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Simpan Perubahan
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
                <DocumentPreviewStudio title="Quotation Studio" initialZoom={0.75}>
                    <A4Preview data={data} isGeneratingPDF={false} />
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

      {/* Modals & Progress */}
      <PrintingProgress isOpen={isGeneratingPDF} progress={printProgress} />

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
