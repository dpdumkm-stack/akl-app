"use client";

import React from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { QuotationData } from "@/lib/types";

interface KetentuanSectionProps {
    data: QuotationData;
    setData: React.Dispatch<React.SetStateAction<QuotationData>>;
}

export default function KetentuanSection({
    data, setData
}: KetentuanSectionProps) {
    const updateArray = (field: 'termin' | 'lingkupKerja' | 'syaratGaransi', index: number, value: string) => {
        setData(prev => {
            const arr = [...(prev[field] || [])];
            arr[index] = value;
            return { ...prev, [field]: arr };
        });
    };

    const addRow = (field: 'termin' | 'lingkupKerja' | 'syaratGaransi') => {
        setData(prev => ({ ...prev, [field]: [...(prev[field] || []), ""] }));
    };

    const removeRow = (field: 'termin' | 'lingkupKerja' | 'syaratGaransi', index: number) => {
        setData(prev => ({ ...prev, [field]: (prev[field] || []).filter((_, i) => i !== index) }));
    };

    const toggleVisibility = (field: 'showLingkupKerja' | 'showSyaratGaransi') => {
        setData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 font-['Outfit',sans-serif]">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 shadow-xl space-y-8 backdrop-blur-sm">
                
                {/* 1. LINGKUP KERJA */}
                <div className={`space-y-4 transition-all duration-300 ${!data.showLingkupKerja ? 'opacity-40' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Ruang Lingkup Kerja</h4>
                            <button 
                                type="button"
                                onClick={() => toggleVisibility('showLingkupKerja')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${data.showLingkupKerja ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30 shadow-lg shadow-blue-900/20' : 'bg-slate-950 text-slate-600 border border-white/5'}`}
                            >
                                {data.showLingkupKerja ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {data.showLingkupKerja ? 'Aktif' : 'Non-Aktif'}
                            </button>
                        </div>
                        {data.showLingkupKerja && (
                            <button type="button" onClick={() => addRow('lingkupKerja')} className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-all">+ Tambah Item</button>
                        )}
                    </div>
                    {data.showLingkupKerja && (
                        <div className="space-y-2">
                            {(data.lingkupKerja || []).map((text, idx) => (
                                <div key={idx} className="flex gap-2 group">
                                    <textarea 
                                        rows={2}
                                        value={text} 
                                        onChange={(e) => updateArray('lingkupKerja', idx, e.target.value)} 
                                        className="flex-1 bg-slate-900/80 border-2 border-white/10 rounded-xl p-3 text-xs font-black text-white shadow-lg focus:border-blue-500 focus:bg-slate-900 transition-all resize-none" 
                                        placeholder="Contoh: Pekerjaan Persiapan..." 
                                    />
                                    <button type="button" onClick={() => removeRow('lingkupKerja', idx)} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 h-fit"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. SYARAT GARANSI */}
                <div className={`space-y-4 transition-all duration-300 pt-6 border-t border-white/5 ${!data.showSyaratGaransi ? 'opacity-40' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Syarat & Garansi</h4>
                            <button 
                                type="button"
                                onClick={() => toggleVisibility('showSyaratGaransi')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${data.showSyaratGaransi ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 shadow-lg shadow-emerald-900/20' : 'bg-slate-950 text-slate-600 border border-white/5'}`}
                            >
                                {data.showSyaratGaransi ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {data.showSyaratGaransi ? 'Aktif' : 'Non-Aktif'}
                            </button>
                        </div>
                        {data.showSyaratGaransi && (
                            <button type="button" onClick={() => addRow('syaratGaransi')} className="text-[9px] font-black text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-all">+ Tambah Syarat</button>
                        )}
                    </div>
                    {data.showSyaratGaransi && (
                        <div className="space-y-2">
                            {(data.syaratGaransi || []).map((text, idx) => (
                                <div key={idx} className="flex gap-2 group">
                                    <textarea 
                                        rows={2}
                                        value={text} 
                                        onChange={(e) => updateArray('syaratGaransi', idx, e.target.value)} 
                                        className="flex-1 bg-slate-900/80 border-2 border-white/10 rounded-xl p-3 text-xs font-black text-white shadow-lg focus:border-emerald-500 focus:bg-slate-900 transition-all resize-none" 
                                        placeholder="Contoh: Masa garansi 6 bulan..." 
                                    />
                                    <button type="button" onClick={() => removeRow('syaratGaransi', idx)} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100 h-fit"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. TERMIN PEMBAYARAN */}
                <div className="space-y-4 pt-6 border-t border-white/5">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Metode Pembayaran</h4>
                        <button type="button" onClick={() => addRow('termin')} className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-all">+ Tambah Termin</button>
                    </div>
                    <div className="space-y-2">
                        {(data.termin || []).map((text, idx) => (
                            <div key={idx} className="flex gap-2 group">
                                <input value={text} onChange={(e) => updateArray('termin', idx, e.target.value)} className="flex-1 bg-slate-900/80 border-2 border-white/10 rounded-xl p-3 text-xs font-black text-white shadow-lg focus:border-blue-500 focus:bg-slate-900 transition-all" placeholder="Contoh: DP 50% setelah PO..." />
                                <button type="button" onClick={() => removeRow('termin', idx)} className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
