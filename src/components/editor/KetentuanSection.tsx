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
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-8">
                
                {/* 1. LINGKUP KERJA */}
                <div className={`space-y-4 transition-all duration-300 ${!data.showLingkupKerja ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ruang Lingkup Kerja</h4>
                            <button 
                                type="button"
                                onClick={() => toggleVisibility('showLingkupKerja')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${data.showLingkupKerja ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}
                            >
                                {data.showLingkupKerja ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {data.showLingkupKerja ? 'Aktif' : 'Non-Aktif'}
                            </button>
                        </div>
                        {data.showLingkupKerja && (
                            <button type="button" onClick={() => addRow('lingkupKerja')} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-all">+ Tambah Item</button>
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
                                        className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-xs font-bold shadow-inner focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none" 
                                        placeholder="Contoh: Pekerjaan Persiapan..." 
                                    />
                                    <button type="button" onClick={() => removeRow('lingkupKerja', idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 h-fit"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 2. SYARAT GARANSI */}
                <div className={`space-y-4 transition-all duration-300 pt-6 border-t border-slate-100 ${!data.showSyaratGaransi ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syarat & Garansi</h4>
                            <button 
                                type="button"
                                onClick={() => toggleVisibility('showSyaratGaransi')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase transition-all ${data.showSyaratGaransi ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                            >
                                {data.showSyaratGaransi ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                {data.showSyaratGaransi ? 'Aktif' : 'Non-Aktif'}
                            </button>
                        </div>
                        {data.showSyaratGaransi && (
                            <button type="button" onClick={() => addRow('syaratGaransi')} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800 transition-all">+ Tambah Syarat</button>
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
                                        className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-xs font-bold shadow-inner focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none" 
                                        placeholder="Contoh: Masa garansi 6 bulan..." 
                                    />
                                    <button type="button" onClick={() => removeRow('syaratGaransi', idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 h-fit"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 3. TERMIN PEMBAYARAN */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode Pembayaran</h4>
                        <button type="button" onClick={() => addRow('termin')} className="text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-800 transition-all">+ Tambah Termin</button>
                    </div>
                    <div className="space-y-2">
                        {(data.termin || []).map((text, idx) => (
                            <div key={idx} className="flex gap-2 group">
                                <input value={text} onChange={(e) => updateArray('termin', idx, e.target.value)} className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-xs font-bold shadow-inner focus:ring-2 focus:ring-slate-500 focus:bg-white transition-all" placeholder="Contoh: DP 50% setelah PO..." />
                                <button type="button" onClick={() => removeRow('termin', idx)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
