"use client";

import React from "react";
import { 
    Phone, Upload, X, Search, BookmarkPlus, Loader2, 
    Settings, UserCheck, Shield, User, Briefcase, 
    CheckCircle2, Sparkles, Trash2, Fingerprint
} from "lucide-react";
import { QuotationData } from "@/lib/types";
import { getSignatories, saveSignatory, deleteSignatory } from "@/app/actions";

interface OtorisasiSectionProps {
    data: QuotationData;
    setData: React.Dispatch<React.SetStateAction<QuotationData>>;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'ttdStempelUrl') => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
    setConfirmModal: (modal: any) => void;
    globalLogoUrl?: string | null;
    globalTTDUrl?: string | null;
}

export default function OtorisasiSection({
    data, setData, onFileUpload, showToast, setConfirmModal, globalLogoUrl, globalTTDUrl
}: OtorisasiSectionProps) {

    const [signatories, setSignatories] = React.useState<any[]>([]);
    const [isLoading, setIsLoading] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");

    const loadSignatories = async () => {
        setIsLoading(true);
        const res = await getSignatories();
        if (res.success && 'data' in res) setSignatories(res.data);
        setIsLoading(false);
    };

    React.useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadSignatories();
    }, []);

    const filteredSignatories = signatories.filter(s => 
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSaveProfile = async () => {
        if (!data.namaPenandatangan || !data.jabatanPenandatangan) {
            showToast("Nama dan Jabatan wajib diisi!", "error");
            return;
        }
        setConfirmModal({
            title: "Amankan Profil?",
            message: `Simpan "${data.namaPenandatangan}" ke dalam database otoritas?`,
            onConfirm: async () => {
                const res = await saveSignatory({
                    nama: data.namaPenandatangan,
                    jabatan: data.jabatanPenandatangan,
                    phone: data.phonePenandatangan,
                    ttdUrl: data.ttdStempelUrl
                });
                if (res.success) {
                    showToast("Profil berhasil diamankan!");
                    loadSignatories();
                } else {
                    showToast("Gagal menyimpan profil.", "error");
                }
            },
            confirmText: "Simpan Profil",
            type: 'primary'
        });
    };

    const handlePickProfile = (s: any) => {
        setData(prev => ({
            ...prev,
            namaPenandatangan: s.nama,
            jabatanPenandatangan: s.jabatan,
            phonePenandatangan: s.phone || '',
            ttdStempelUrl: s.ttdUrl
        }));
        showToast(`Otoritas: ${s.nama} diaktifkan.`);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-8 pb-10">
            {/* GLASS CARD CONTAINER */}
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-[48px] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden">
                
                {/* HEADER DECORATION */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 blur-[100px] rounded-full pointer-events-none"></div>

                {/* HEADER AREA */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-12 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600/20 to-blue-600/5 rounded-[22px] flex items-center justify-center border border-blue-500/20 text-blue-400 shadow-xl shadow-blue-900/10 transition-transform hover:scale-105 duration-500">
                            <Fingerprint className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-base font-black text-white uppercase tracking-[0.15em] italic">Pengesahan Dokumen</h4>
                                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                                <Shield className="w-3 h-3 text-emerald-500" /> Authorized Signatory Module
                            </p>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleSaveProfile}
                        className="group/save flex items-center gap-3 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/30 hover:shadow-emerald-900/50 hover:translate-y-[-2px] active:scale-95"
                    >
                        <BookmarkPlus className="w-4 h-4 transition-transform group-hover/save:scale-110" />
                        SIMPAN PROFIL
                    </button>
                </div>

                {/* DATABASE QUICK ACCESS (NOW AT TOP FOR INSTANT ACCESS) */}
                <div className="relative z-10 mb-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                            <h5 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Otoritas Tersimpan (Klik untuk Pilih)</h5>
                        </div>
                        <div className="relative w-full sm:w-64 group/search">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-focus-within/search:text-blue-500 transition-colors" />
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-950/60 border border-white/5 rounded-full py-2.5 pl-10 pr-4 text-[10px] font-bold text-slate-300 outline-none focus:border-blue-500/30 transition-all placeholder:text-slate-800" 
                                placeholder="CARI PROFIL..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[220px] overflow-y-auto no-scrollbar pr-1">
                        {isLoading ? (
                            <div className="col-span-full py-8 flex flex-col items-center gap-3">
                                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                            </div>
                        ) : filteredSignatories.length > 0 ? (
                            filteredSignatories.map(s => (
                                <div key={s.id} className="relative group/card">
                                    <div 
                                        onClick={() => handlePickProfile(s)}
                                        className={`p-4 rounded-[24px] border cursor-pointer transition-all duration-300 relative overflow-hidden h-full flex items-center gap-4 ${
                                            data.namaPenandatangan === s.nama 
                                            ? 'bg-blue-600/20 border-blue-500/40 shadow-lg shadow-blue-900/10' 
                                            : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center font-black text-sm transition-all ${
                                            data.namaPenandatangan === s.nama ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'
                                        }`}>
                                            {s.nama.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h6 className={`text-[11px] font-black uppercase tracking-tight leading-tight mb-1 ${data.namaPenandatangan === s.nama ? 'text-white' : 'text-slate-200'}`}>
                                                {s.nama}
                                            </h6>
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">{s.jabatan}</p>
                                        </div>
                                        {data.namaPenandatangan === s.nama && (
                                            <div className="flex-shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmModal({
                                                title: "Hapus Otoritas?",
                                                message: `Data "${s.nama}" akan dihapus.`,
                                                onConfirm: async () => {
                                                    const res = await deleteSignatory(s.id);
                                                    if (res.success) {
                                                        showToast("Data dihapus.");
                                                        loadSignatories();
                                                    }
                                                },
                                                confirmText: "Hapus",
                                                type: 'danger'
                                            });
                                        }}
                                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white rounded-lg flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all shadow-xl z-20 hover:scale-110 active:scale-90"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-10 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                                <p className="text-[9px] font-black text-slate-800 uppercase tracking-[0.3em] italic">Kosong</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* INPUT GRID AREA (MANUAL ENTRIES) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12 relative z-10 pt-10 border-t border-white/5">
                    <div className="md:col-span-7 space-y-4">
                        <div className="relative group/field">
                            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/field:text-blue-400 transition-colors" />
                            <input 
                                value={data.namaPenandatangan || ''} 
                                onChange={(e) => setData(prev => ({ ...prev, namaPenandatangan: e.target.value }))} 
                                className="w-full bg-slate-950/40 border border-white/5 group-focus-within/field:border-blue-500/30 rounded-[20px] p-5 pl-14 text-sm font-black text-white shadow-inner outline-none transition-all uppercase placeholder:text-slate-800 placeholder:font-bold" 
                                placeholder="NAMA LENGKAP PENANDATANGAN" 
                            />
                        </div>
                        <div className="relative group/field">
                            <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/field:text-blue-400 transition-colors" />
                            <input 
                                value={data.jabatanPenandatangan || ''} 
                                onChange={(e) => setData(prev => ({ ...prev, jabatanPenandatangan: e.target.value }))} 
                                className="w-full bg-slate-950/40 border border-white/5 group-focus-within/field:border-blue-500/30 rounded-[20px] p-5 pl-14 text-sm font-bold text-slate-200 shadow-inner outline-none transition-all uppercase placeholder:text-slate-800 placeholder:font-bold" 
                                placeholder="JABATAN STRUKTURAL" 
                            />
                        </div>
                        <div className="relative group/field">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within/field:text-blue-400 transition-colors" />
                            <input 
                                value={data.phonePenandatangan || ''} 
                                onChange={(e) => setData(prev => ({ ...prev, phonePenandatangan: e.target.value }))} 
                                className="w-full bg-slate-950/40 border border-white/5 group-focus-within/field:border-blue-500/30 rounded-[20px] p-5 pl-14 text-sm font-bold text-white shadow-inner outline-none transition-all placeholder:text-slate-800 placeholder:font-bold" 
                                placeholder="NOMOR TELEPON / WHATSAPP" 
                            />
                        </div>
                    </div>

                    {/* SIGNATURE PREVIEW CANVAS */}
                    <div className="md:col-span-5 flex flex-col h-full">
                        <div className="flex-1 bg-slate-950/60 rounded-[32px] border border-white/5 p-6 flex flex-col items-center justify-center relative group/canvas shadow-inner">
                            {data.ttdStempelUrl ? (
                                <div className="relative w-full h-full flex items-center justify-center p-4">
                                    <img src={data.ttdStempelUrl} className="max-w-full max-h-32 object-contain filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-transform group-hover/canvas:scale-110 duration-500" alt="Sign" />
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-4/5 h-[1px] bg-white/10 group-hover/canvas:bg-blue-500/30 transition-all"></div>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                                        <Upload className="w-6 h-6 text-slate-700" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Pratinjau TTD</p>
                                </div>
                            )}
                            
                            <label className="absolute inset-0 cursor-pointer rounded-[32px]">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileUpload(e, 'ttdStempelUrl')} />
                            </label>

                            {data.ttdStempelUrl && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setData(prev => ({ ...prev, ttdStempelUrl: '' })) }}
                                    className="absolute top-4 right-4 w-8 h-8 bg-red-600/80 hover:bg-red-600 text-white rounded-xl flex items-center justify-center shadow-lg transition-all active:scale-90"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <button 
                            className="mt-4 w-full py-4 bg-slate-900 border border-white/5 rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all shadow-md group/up"
                            onClick={() => document.getElementById('ttd-upload-input')?.click()}
                        >
                            <Upload className="w-4 h-4 group-hover/up:-translate-y-1 transition-transform" />
                            Unggah Berkas TTD
                            <input id="ttd-upload-input" type="file" accept="image/*" className="hidden" onChange={(e) => onFileUpload(e, 'ttdStempelUrl')} />
                        </button>
                    </div>
                </div>

                {/* LOGO INFO BADGE - INTEGRATED */}
                <div className="mt-12 flex justify-end">
                    <div className="px-6 py-2.5 bg-gradient-to-r from-blue-600/10 to-transparent border-l-2 border-blue-500 flex items-center gap-4 group cursor-help">
                        <Settings className="w-4 h-4 text-blue-500 group-hover:rotate-90 transition-transform duration-700" />
                        <div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Identitas Perusahaan: Statis</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Konfigurasi di Dashboard Utama</p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
