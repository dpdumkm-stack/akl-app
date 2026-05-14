"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QuotationData } from "@/lib/types";
import { DEFAULT_LINGKUP, DEFAULT_SYARAT } from "@/lib/constants";
import { getUniqueId, getRomanMonth, formatQuotationNumber } from "@/lib/utils";
import FormEditor from "@/components/FormEditor";
import A4Preview from "@/components/A4Preview";
import HistoryDrawer from "@/components/HistoryDrawer";
import PrintingProgress from "@/components/PrintingProgress";
import { History, AlertCircle, Lock, FilePlus, FileText, LayoutDashboard } from "lucide-react";

import { 
    saveQuotation, 
    getGlobalSettings, 
    saveGlobalSetting, 
    getNextQuotationNumber,
    getSignatories
} from "@/app/actions";



export default function QuotationApp() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [globalLogo, setGlobalLogo] = useState<string | null>(null);
  const [globalTTD, setGlobalTTD] = useState<string | null>(null);
  const [printProgress, setPrintProgress] = useState(0);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ 
    title: string; 
    message: string; 
    onConfirm: () => void; 
    confirmText?: string;
    type?: 'danger' | 'primary' 
  } | null>(null);
  
  const [data, setData] = useState<QuotationData>({
    nomorSurat: '001/PH-AKL/I/2026', 
    tanggal: '', 
    namaKlien: '', up: '', lokasi: '', logoUrl: null, ttdStempelUrl: null,
    namaPenandatangan: 'Apip, S.Kom.', jabatanPenandatangan: 'Marketing Executive', phonePenandatangan: '0812-1940-0496',
    termin: ['DP 30% setelah SPK / PO diterima.', 'Pelunasan 70% setelah BAST ditandatangani.'],
    lingkupKerja: DEFAULT_LINGKUP, syaratGaransi: DEFAULT_SYARAT,
    items: [], 
    showLingkupKerja: true, showSyaratGaransi: true, isHargaSatuanMode: false, isJasaBahanMode: false, isMaterialOnlyMode: false, diskon: 0, kenakanPPN: false,
    nomorUrut: 1
  });

  const [mounted, setMounted] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPrintingRef = useRef(false);
  
  // Track latest data with ref to prevent callback identity changes
  const dataRef = useRef(data);
  useEffect(() => { dataRef.current = data; }, [data]);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {

    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleSetData = useCallback((newData: any) => {
    setData(newData);
    setIsDirty(true);
  }, []);

  // Safe Mode: Prevent accidental navigation
  // Safe Mode: Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);







  const validateData = useCallback(() => {
    const hasClientInfo = (data.namaKlien || '').trim() !== '' || (data.up || '').trim() !== '';
    const hasItems = (data.items || []).some(item => (item.deskripsi || '').trim() !== '');

    if (!hasClientInfo) {
      showToast("Minimal isi salah satu antara Nama Perusahaan atau Nama Penerima (U.P.)", "error");
      return false;
    }

    if (!hasItems) {
      showToast("Mohon isi minimal satu item pekerjaan agar penawaran memiliki rincian harga.", "error");
      return false;
    }

    return true;
  }, [data.namaKlien, data.up, data.items, showToast]);

  // Use refs to stabilize functions used inside other callbacks/effects
  const validateDataRef = useRef(validateData);
  useEffect(() => { validateDataRef.current = validateData; }, [validateData]);

  const handleSave = useCallback(async () => {
    if (!validateDataRef.current()) return { success: false, message: "Validasi Gagal" };
    
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
          setData(prev => ({...prev, id: res.id}));
          setIsDirty(false);
          showToast("Berhasil disimpan ke Database!");
          return res;
        } else {
          showToast("Gagal menyimpan: " + (res as any).message, "error");
          return res;
        }
      } catch(err: any) {
        console.error(err);
        const msg = err?.message || "Kesalahan Sistem";
        showToast("Terjadi kesalahan: " + msg, "error");
        return { success: false, message: msg };
      } finally {
        setIsSaving(false);
      }
  }, [data, validateData, showToast]);

  const handleSaveRef = useRef(handleSave);
  useEffect(() => { handleSaveRef.current = handleSave; }, [handleSave]);


  const createNew = async () => {
    const reset = async () => {
      setIsSaving(true); // Guna show loading state sementara
      const nextRes = await getNextQuotationNumber();
      let nextUrut = 1;
      if (nextRes.success && nextRes.nextUrut) {
        nextUrut = nextRes.nextUrut;
      }

      const settings = await getGlobalSettings();
      let logo = null;
      let ttd = null;
      if (settings.success && 'data' in settings) {
        logo = settings.data.find((s: any) => s.id === 'LOGO')?.value || null;
        ttd = settings.data.find((s: any) => s.id === 'TTD')?.value || null;
      }

      // Load Default Signatory
      const sigRes = await getSignatories();
      let defaultSig = {
          nama: 'Apip, S.Kom.',
          jabatan: 'Marketing Executive',
          phone: '0812-1940-0496',
          ttd: ttd
      };
      if (sigRes.success && 'data' in sigRes && sigRes.data.length > 0) {
          const s = sigRes.data[0];
          defaultSig = {
              nama: s.nama,
              jabatan: s.jabatan,
              phone: s.phone || '',
              ttd: s.ttdUrl || ttd
          };
      }


      setData({
        nomorSurat: formatQuotationNumber(nextUrut),
        nomorUrut: nextUrut,
        tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        namaKlien: '', up: '', lokasi: '', 
        logoUrl: null, // Permanent global fallback
        ttdStempelUrl: defaultSig.ttd,
        namaPenandatangan: defaultSig.nama,
        jabatanPenandatangan: defaultSig.jabatan,
        phonePenandatangan: defaultSig.phone,


        termin: ['DP 30% setelah SPK / PO diterima.', 'Pelunasan 70% setelah BAST ditandatangani.'],
        lingkupKerja: DEFAULT_LINGKUP, syaratGaransi: DEFAULT_SYARAT,
        items: [{ id: getUniqueId(), deskripsi: '', bahan: '', volume: 0, satuan: 'm²', harga: 0, hargaBahan: 0, hargaJasa: 0 }],
        showLingkupKerja: true, showSyaratGaransi: true, isHargaSatuanMode: false, isJasaBahanMode: false, isMaterialOnlyMode: false, diskon: 0, kenakanPPN: false,
      });
      setIsDirty(false);
      setIsSaving(false);
      showToast("Formulir telah di-reset dengan nomor urut terbaru.");
    };

    if (isDirty) {
      setConfirmModal({
        title: "Buat Penawaran Baru?",
        message: "Draf saat ini belum disimpan. Yakin ingin membuang perubahan?",
        onConfirm: reset,
        confirmText: "Ya, Buat Baru",
        type: 'danger'
      });
    } else {
      await reset();
    }
  };


  const handleLogout = useCallback(() => {
    const doLogout = async () => {
      showToast("Sedang keluar dari sistem...", "success");
      await signOut({ callbackUrl: '/login' });
    };

    if (isDirty) {
      setConfirmModal({
        title: "Logout Sekarang?",
        message: "Ada perubahan yang belum disimpan. Yakin ingin keluar dan membuang draf ini?",
        onConfirm: doLogout,
        confirmText: "Ya, Keluar",
        type: 'danger'
      });
    } else {
      doLogout();
    }
  }, [isDirty, showToast]);

  const handleDownloadPDF = useCallback(async () => {
    if (!validateDataRef.current()) return;
    if (isPrintingRef.current) return; // Cegah double trigger

    isPrintingRef.current = true;
    setIsGeneratingPDF(true); 
    setPrintProgress(0);
    
    // Hapus simulasi progres dari sini, pindahkan ke useEffect di bawah
    
    try {
      setPrintProgress(10);
      const saveRes = await handleSaveRef.current();
      if (!saveRes || !saveRes.success) {
          throw new Error("Gagal menyimpan dokumen sebelum cetak.");
      }
      
      const currentId = saveRes.id || data.id;
      if (!currentId) throw new Error("ID dokumen tidak ditemukan.");

      setPrintProgress(25);

      const response = await fetch(`/api/pdf?id=${currentId}`);

      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'Gagal generate PDF di server');
      }

      setPrintProgress(100);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const currentData = dataRef.current;
      
      // Logika Penamaan File: Nomor Surat + Nama (PT/UP)
      const docNumber = (currentData.nomorSurat || 'DRAFT').replace(/[^\w\s-]/gi, '').replace(/\s+/g, '-');
      const clientName = (currentData.companyName || currentData.namaKlien || currentData.up || 'Client')
          .replace(/[^\w\s-]/gi, '')
          .replace(/\s+/g, '_');
      
      a.download = `${docNumber}_${clientName}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      showToast("PDF berhasil diunduh!");

      setTimeout(() => {
        setIsGeneratingPDF(false);
        isPrintingRef.current = false;
      }, 1000);

    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Gagal mengunduh PDF.', 'error');
      setIsGeneratingPDF(false);
      isPrintingRef.current = false;
    }
  }, []); // COMPLETE STABILITY


  // Efek Pemuatan Awal & Manajemen Siklus Hidup
  useEffect(() => {
    setMounted(true);
    
    // Progress Animation Side-Effect
    if (isGeneratingPDF) {
        progressIntervalRef.current = setInterval(() => {
            setPrintProgress(prev => {
                if (prev < 70) return prev + 1.5;
                if (prev < 90) return prev + 0.5;
                if (prev < 98) return prev + 0.1;
                return prev;
            });
        }, 200);
    } else {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setPrintProgress(0);
    }

    return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isGeneratingPDF]);

  useEffect(() => {
    const loadDefaults = async () => {
        try {
            const settings = await getGlobalSettings();
            let logo = null;
            let ttd = null;
            
            if (settings.success && 'data' in settings) {
                logo = settings.data.find((s: any) => s.id === 'LOGO')?.value || null;
                ttd = settings.data.find((s: any) => s.id === 'TTD')?.value || null;
                setGlobalLogo(logo);
                setGlobalTTD(ttd);
            }

            const nextRes = await getNextQuotationNumber();
            let nextUrut = 1;
            if (nextRes.success && nextRes.nextUrut) {
                nextUrut = nextRes.nextUrut;
            }

            const sigRes = await getSignatories();
            let defaultSig = {
                nama: 'Apip, S.Kom.', jabatan: 'Marketing Executive', phone: '0812-1940-0496', ttd: ttd
            };
            if (sigRes.success && 'data' in sigRes && sigRes.data.length > 0) {
                const s = sigRes.data[0];
                defaultSig = {
                    nama: s.nama, jabatan: s.jabatan, phone: s.phone || '', ttd: s.ttdUrl || ttd
                };
            }

            setData(prev => ({
                ...prev,
                nomorUrut: nextUrut,
                nomorSurat: formatQuotationNumber(nextUrut),
                tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                items: [{ id: getUniqueId(), deskripsi: '', bahan: '', volume: 0, satuan: 'm²', harga: 0, hargaBahan: 0, hargaJasa: 0 }],
                logoUrl: null,
                ttdStempelUrl: defaultSig.ttd,
                namaPenandatangan: defaultSig.nama,
                jabatanPenandatangan: defaultSig.jabatan,
                phonePenandatangan: defaultSig.phone
            }));
        } catch (err) {
            console.error("Initialization Error:", err);
            showToast("Gagal memuat preferensi, menggunakan profil standar.", "error");
        }
    };
    
    loadDefaults();

    return () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [showToast]); // Dipicu ulang jika showToast berubah (tapi showToast di-memo)




  if (!mounted) return null; 

  return (

    <div className={`min-h-[100dvh] bg-slate-100 font-sans text-slate-800 pb-[130px] lg:pb-0 print:bg-white print:pb-0 ${isGeneratingPDF ? 'pointer-events-none' : ''}`}>
        
        {/* TOP BAR */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-40 print:hidden shadow-sm">
            <div className="max-w-[1800px] mx-auto px-4 lg:px-8 py-3 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-xs">AKL</div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black text-slate-800 tracking-tighter">STUDIO AKL</h1>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none">Management System</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {session?.user && (
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logged In as</p>
                            <p className="text-xs font-bold text-slate-700">{session.user.name}</p>
                        </div>
                    )}
                    <button 
                        onClick={() => router.push("/dashboard")}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all flex items-center gap-2 shadow-sm"
                        title="Dashboard Admin"
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="hidden md:inline text-xs font-bold">Dashboard</span>
                    </button>
                    <button 
                        onClick={() => router.push("/invoice")}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all flex items-center gap-2 shadow-sm"
                        title="Invoice Generator"
                    >
                        <FileText className="w-5 h-5" />
                        <span className="hidden md:inline text-xs font-bold">Invoice</span>
                    </button>
                    <button 
                        onClick={createNew}
                        className="p-2.5 bg-emerald-50 text-emerald-700 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 shadow-sm border border-emerald-100"
                        title="Buat Penawaran Baru (Reset Form)"
                    >
                        <FilePlus className="w-5 h-5" />
                        <span className="hidden md:inline text-xs font-bold uppercase tracking-wider">Buat Baru</span>
                    </button>
                    <button 
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <History className="w-5 h-5" />
                        <span className="hidden md:inline text-xs font-bold">Riwayat</span>
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="p-2.5 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg"
                        title="Logout dari Sistem"
                    >
                        <Lock className="w-4 h-4" />
                        <span className="hidden md:inline text-xs font-bold">Logout</span>
                    </button>

                </div>
            </div>
        </div>

        <HistoryDrawer 
            isOpen={isHistoryOpen} 
            onClose={() => setIsHistoryOpen(false)} 
            onLoad={(loadedData) => {
                setData(loadedData);
                setIsDirty(false);
                showToast("Data berhasil dimuat.");
            }}
            showToast={showToast}
            setConfirmModal={setConfirmModal}
        />

        <PrintingProgress 
            isOpen={isGeneratingPDF}
            progress={printProgress}
        />

        <div className="max-w-[1800px] mx-auto px-0 lg:px-6 py-0 lg:py-6 h-[calc(100vh-64px)] overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 h-full gap-0 lg:gap-6">
                
                {/* LEFT: FORM AREA (THE MASTER COCKPIT) */}
                <div className="lg:col-span-6 xl:col-span-5 h-full overflow-y-auto custom-scrollbar bg-white lg:bg-transparent lg:rounded-3xl lg:border lg:border-slate-200/50 relative">
                    <div className="p-4 lg:p-6 pb-32">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                            <div>
                                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tighter">Editor Penawaran</h2>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Workbench v2.5 • {isDirty ? <span className="text-orange-500 animate-pulse">Menunggu Simpan</span> : <span className="text-emerald-500">Tersinkronisasi</span>}</p>
                            </div>
                        </div>
                        
                        <FormEditor 
                            data={data} 
                            setData={handleSetData} 
                            onSave={handleSave} 
                            onDownloadPDF={handleDownloadPDF} 
                            isGeneratingPDF={isGeneratingPDF} 
                            isSaving={isSaving}
                            showToast={showToast}
                            setConfirmModal={setConfirmModal}
                            globalLogoUrl={globalLogo}
                            globalTTDUrl={globalTTD}
                        />

                    </div>
                </div>

                {/* RIGHT: PREVIEW AREA (THE STUDIO) */}
                <div className="lg:col-span-6 xl:col-span-7 h-full bg-slate-900/5 lg:bg-slate-900/[0.02] lg:rounded-[40px] border border-slate-200/50 overflow-hidden relative group">
                    {/* Live Indicator Badge */}
                    <div className="absolute top-6 left-6 z-30 no-print">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-slate-200">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Preview Studio Aktif</span>
                        </div>
                    </div>

                    <A4Preview 
                        data={data} 
                        isGeneratingPDF={isGeneratingPDF} 
                        viewMode="edit" 
                        globalLogoUrl={globalLogo}
                        globalTTDUrl={globalTTD}
                    />
                </div>

            </div>
        </div>

        {/* TOAST SYSTEM */}
        {toast && (
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm transition-all animate-in slide-in-from-bottom-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {toast.type === 'success' ? '✓' : '✕'}
                </div>
                <span>{toast.msg}</span>
            </div>
        )}

        {/* CONFIRMATION MODAL SYSTEM */}
        {confirmModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmModal(null)}></div>
                <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-200">
                    <div className="text-center space-y-2">
                        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${confirmModal.type === 'danger' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">{confirmModal.title}</h3>
                        <p className="text-sm text-slate-500 font-medium">{confirmModal.message}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <button onClick={() => setConfirmModal(null)} className="py-3.5 rounded-2xl bg-slate-50 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Batal</button>
                        <button 
                            onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} 
                            className={`py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all ${confirmModal.type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {confirmModal.confirmText || 'Konfirmasi'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
}
