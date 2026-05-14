"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, Save, Upload, X, Settings, 
  ShieldCheck, Image as ImageIcon, CheckCircle, AlertCircle,
  RefreshCw, Bookmark, PenTool
} from "lucide-react";
import { saveGlobalSetting, getGlobalSettings } from "@/app/actions";
import { compressImage } from "@/lib/image-utils";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  
  const [settings, setSettings] = useState({
    logo: "",
    ttd: ""
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await getGlobalSettings();
        if (res.success && 'data' in res) {
          const s = res.data as any[];
          const logo = s.find(it => it.id === 'LOGO')?.value || "";
          const ttd = s.find(it => it.id === 'TTD')?.value || "";
          setSettings({ logo, ttd });
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    if (status === "authenticated") fetchSettings();
  }, [status]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'ttd') => {
    const file = e.target.files?.[0];
    if (!file) return;

    showToast("Memproses gambar...");
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        const compressed = await compressImage(base64, type === 'logo' ? 400 : 300, 0.8);
        setSettings(prev => ({ ...prev, [type]: compressed }));
        
        // Auto save on upload for better UX
        const id = type === 'logo' ? 'LOGO' : 'TTD';
        const res = await saveGlobalSetting(id, compressed);
        if (res.success) {
          showToast(`${type === 'logo' ? 'Logo' : 'Tanda Tangan'} berhasil diperbarui!`);
        } else {
          showToast("Gagal menyimpan ke database", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Gagal memproses gambar", "error");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (type: 'logo' | 'ttd') => {
    if (!window.confirm(`Hapus ${type === 'logo' ? 'Logo' : 'Tanda Tangan'}?`)) return;
    
    setSettings(prev => ({ ...prev, [type]: "" }));
    const id = type === 'logo' ? 'LOGO' : 'TTD';
    const res = await saveGlobalSetting(id, "");
    if (res.success) {
      showToast(`${type === 'logo' ? 'Logo' : 'Tanda Tangan'} dihapus.`);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[100px] rounded-full" />
      </div>

      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/dashboard")} className="p-2.5 hover:bg-white/5 rounded-xl transition-all group">
              <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:-translate-x-1 transition-all" />
            </button>
            <div>
              <h1 className="text-sm font-black text-white uppercase italic tracking-tight">Pengaturan Sistem</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">Identitas Korporat</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-600/20 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Admin Access</span>
             </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <header className="mb-12 space-y-2">
           <h2 className="text-3xl font-black text-white tracking-tight">Profil & Identitas <span className="text-blue-500">AKL</span></h2>
           <p className="text-slate-400 font-medium max-w-2xl">Kelola aset visual perusahaan yang akan digunakan secara otomatis pada setiap dokumen Penawaran dan Invoice.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Logo Section */}
           <section className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 space-y-8 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full -mr-16 -mt-16" />
              
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-600/20">
                    <ImageIcon className="w-6 h-6 text-blue-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Logo Kop Surat</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Header Utama Dokumen</p>
                 </div>
              </div>

              <div className="aspect-video bg-slate-950 rounded-[32px] border-2 border-dashed border-white/5 flex items-center justify-center relative overflow-hidden group/img shadow-inner">
                 {settings.logo ? (
                   <>
                    <img src={settings.logo} className="max-w-[80%] max-h-[80%] object-contain drop-shadow-2xl" alt="Corporate Logo" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                       <button onClick={() => handleDelete('logo')} className="p-3 bg-red-600 text-white rounded-2xl hover:scale-110 transition-all shadow-xl shadow-red-900/40">
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                   </>
                 ) : (
                   <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                         <Upload className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Belum ada logo</p>
                   </div>
                 )}
              </div>

              <div className="space-y-4">
                 <label className="block w-full">
                    <span className="sr-only">Upload Logo</span>
                    <div className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest cursor-pointer transition-all shadow-xl shadow-blue-900/40 active:scale-95">
                       <Upload className="w-4 h-4" /> Pilih File Logo Baru
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                    </div>
                 </label>
                 <p className="text-[9px] text-slate-600 font-bold uppercase text-center tracking-tighter">Direkomendasikan: PNG Transparan atau Background Putih (Maks 1MB)</p>
              </div>
           </section>

           {/* Signature Section */}
           <section className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 space-y-8 backdrop-blur-sm shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 blur-3xl rounded-full -mr-16 -mt-16" />

              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-600/10 rounded-2xl flex items-center justify-center border border-emerald-600/20">
                    <PenTool className="w-6 h-6 text-emerald-400" />
                 </div>
                 <div>
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Tanda Tangan Default</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Stempel & Otorisasi</p>
                 </div>
              </div>

              <div className="aspect-video bg-slate-950 rounded-[32px] border-2 border-dashed border-white/5 flex items-center justify-center relative overflow-hidden group/img shadow-inner">
                 {settings.ttd ? (
                   <>
                    <img src={settings.ttd} className="max-w-[80%] max-h-[80%] object-contain drop-shadow-2xl" alt="Default Signature" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                       <button onClick={() => handleDelete('ttd')} className="p-3 bg-red-600 text-white rounded-2xl hover:scale-110 transition-all shadow-xl shadow-red-900/40">
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                   </>
                 ) : (
                   <div className="text-center space-y-3">
                      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto text-slate-700">
                         <PenTool className="w-8 h-8" />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Belum ada TTD</p>
                   </div>
                 )}
              </div>

              <div className="space-y-4">
                 <label className="block w-full">
                    <span className="sr-only">Upload TTD</span>
                    <div className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest cursor-pointer transition-all shadow-xl active:scale-95 border border-white/5">
                       <Upload className="w-4 h-4" /> Pilih File TTD Baru
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'ttd')} />
                    </div>
                 </label>
                 <p className="text-[9px] text-slate-600 font-bold uppercase text-center tracking-tighter">Wajib: PNG Transparan untuk hasil cetak terbaik di PDF</p>
              </div>
           </section>
        </div>

        {/* Info Box */}
        <footer className="mt-12 bg-blue-600/5 border border-blue-600/10 rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-6">
           <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-8 h-8 text-blue-400" />
           </div>
           <div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1 italic">Sistem Terintegrasi</h4>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">Perubahan pada logo dan tanda tangan di sini akan langsung berdampak pada seluruh pembuatan Penawaran (Quotation) dan Invoice baru. Data yang sudah tersimpan pada dokumen lama tidak akan terpengaruh untuk menjaga integritas arsip.</p>
           </div>
        </footer>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 right-8 px-8 py-5 rounded-[24px] shadow-2xl z-[100] flex items-center gap-4 animate-in fade-in slide-in-from-right-4 duration-500 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-black uppercase tracking-widest">{toast.msg}</p>
        </div>
      )}
    </div>
  );
}
