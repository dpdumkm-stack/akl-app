"use client";

import React from "react";
import { Phone, Upload, X, Search, BookmarkPlus, Loader2 } from "lucide-react";
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

    const loadSignatories = async () => {
        setIsLoading(true);
        const res = await getSignatories();
        if (res.success && 'data' in res) setSignatories(res.data);
        setIsLoading(false);
    };

    React.useEffect(() => {
        loadSignatories();
    }, []);

    const handleSaveProfile = async () => {
        if (!data.namaPenandatangan || !data.jabatanPenandatangan) {
            showToast("Nama dan Jabatan wajib diisi!", "error");
            return;
        }
        setConfirmModal({
            title: "Simpan Profil?",
            message: `Simpan "${data.namaPenandatangan}" sebagai profil penandatangan tetap?`,
            onConfirm: async () => {
                const res = await saveSignatory({
                    nama: data.namaPenandatangan,
                    jabatan: data.jabatanPenandatangan,
                    phone: data.phonePenandatangan,
                    ttdUrl: data.ttdStempelUrl
                });
                if (res.success) {
                    showToast("Profil penandatangan disimpan!");
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
        showToast(`Profil ${s.nama} dimuat.`);
    };
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Penandatangan</h4>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleSaveProfile}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                            >
                                <BookmarkPlus className="w-3 h-3" />
                                Simpan Profil
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-300 uppercase tracking-widest ml-1">Nama & Jabatan</label>
                        <input 
                            value={data.namaPenandatangan || ''} 
                            onChange={(e) => setData(prev => ({ ...prev, namaPenandatangan: e.target.value }))} 
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-black shadow-inner outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all uppercase" 
                            placeholder="Ketik Nama..." 
                        />
                        <input 
                            value={data.jabatanPenandatangan || ''} 
                            onChange={(e) => setData(prev => ({ ...prev, jabatanPenandatangan: e.target.value }))} 
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold uppercase shadow-inner outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                            placeholder="Ketik Jabatan..." 
                        />
                        <div className="relative">
                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input 
                                value={data.phonePenandatangan || ''} 
                                onChange={(e) => setData(prev => ({ ...prev, phonePenandatangan: e.target.value }))} 
                                className="w-full p-4 pl-12 bg-slate-50 border-none rounded-2xl text-xs font-bold shadow-inner outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all" 
                                placeholder="Nomor Telepon / WhatsApp..." 
                            />
                        </div>
                    </div>

                    {/* Master Profiles List */}
                    <div className="pt-6 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block flex items-center gap-2">
                            <Search className="w-3 h-3 text-blue-500" />
                            Database Penandatangan
                        </label>
                        
                        {signatories.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {signatories.map(s => (
                                    <div key={s.id} className="relative group flex-shrink-0">
                                        <button 
                                            onClick={() => handlePickProfile(s)}
                                            className={`px-4 py-2.5 border rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-2 ${
                                                data.namaPenandatangan === s.nama 
                                                ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-100' 
                                                : 'bg-white border-slate-200 text-slate-700 hover:border-blue-500 hover:bg-blue-50'
                                            }`}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${data.namaPenandatangan === s.nama ? 'bg-white animate-pulse' : 'bg-blue-500'}`}></div>
                                            {s.nama}
                                        </button>
                                        <button 
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                setConfirmModal({
                                                    title: "Hapus Profil?",
                                                    message: `Hapus profil "${s.nama}" secara permanen?`,
                                                    onConfirm: async () => {
                                                        const res = await deleteSignatory(s.id);
                                                        if (res.success) {
                                                            showToast("Profil dihapus.");
                                                            loadSignatories();
                                                        }
                                                    },
                                                    confirmText: "Hapus",
                                                    type: 'danger'
                                                });
                                            }}
                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-relaxed">
                                    Belum ada profil tersimpan.<br/>
                                    Isi data di atas & klik <span className="text-emerald-600">"Simpan Profil"</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upload TTD */}
                <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
                    <div className="relative group">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                            {data.ttdStempelUrl ? <img src={data.ttdStempelUrl} className="w-full h-full object-contain" /> : <Phone className="w-6 h-6 text-slate-300" />}
                        </div>
                        <label className="absolute inset-0 cursor-pointer opacity-0"><input type="file" accept="image/*" onChange={(e) => onFileUpload(e, 'ttdStempelUrl')} /></label>
                        <button onClick={() => setData({ ...data, ttdStempelUrl: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Tanda Tangan & Stempel</div>
                        <div className="text-[9px] text-slate-400 mb-2 italic">Format PNG (transparan) direkomendasikan.</div>
                        <label className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            Pilih Gambar
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileUpload(e, 'ttdStempelUrl')} />
                        </label>
                    </div>
                </div>

                {/* Upload LOGO */}
                <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
                    <div className="relative group">
                        <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                            {(data.logoUrl || globalLogoUrl) ? <img src={data.logoUrl || globalLogoUrl || ""} className="w-full h-full object-contain" /> : <Upload className="w-6 h-6 text-slate-300" />}
                        </div>
                        <label className="absolute inset-0 cursor-pointer opacity-0"><input type="file" accept="image/*" onChange={(e) => onFileUpload(e, 'logoUrl')} /></label>
                        <button onClick={() => setData({ ...data, logoUrl: '' })} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="flex-1">
                        <div className="text-[10px] font-black uppercase text-slate-400 mb-1">Logo Kop Surat</div>
                        <div className="text-[9px] text-slate-400 mb-2 italic">Akan muncul di bagian kiri atas dokumen PDF.</div>
                        <label className="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                            Pilih Gambar
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => onFileUpload(e, 'logoUrl')} />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}
