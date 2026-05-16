"use client";

import React from "react";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { QuotationData } from "@/lib/types";
import TextEditorTrigger from "@/components/TextEditorTrigger";

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
                        <div className="space-y-4">
                            {(data.lingkupKerja || []).map((text, idx) => (
                                <div key={idx} className="flex gap-2 group items-start">
                                    <div className="flex-1">
                                        <TextEditorTrigger
                                            value={text}
                                            onChange={(val) => updateArray('lingkupKerja', idx, val)}
                                            title={`Lingkup Kerja ${idx + 1}`}
                                            placeholder="Contoh: Pekerjaan Persiapan..."
                                            accentColor="blue"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeRow('lingkupKerja', idx)} className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 rounded-xl transition-all mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 className="w-5 h-5 sm:w-4 sm:h-4" /></button>
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
                        <div className="space-y-4">
                            {(data.syaratGaransi || []).map((text, idx) => (
                                <div key={idx} className="flex gap-2 group items-start">
                                    <div className="flex-1">
                                        <TextEditorTrigger
                                            value={text}
                                            onChange={(val) => updateArray('syaratGaransi', idx, val)}
                                            title={`Syarat Garansi ${idx + 1}`}
                                            placeholder="Contoh: Masa garansi 6 bulan..."
                                            accentColor="emerald"
                                        />
                                    </div>
                                    <button type="button" onClick={() => removeRow('syaratGaransi', idx)} className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 rounded-xl transition-all mt-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 className="w-5 h-5 sm:w-4 sm:h-4" /></button>
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
                    <div className="space-y-4">
                        {(data.termin || []).map((text, idx) => (
                            <div key={idx} className="flex gap-2 group items-center">
                                <input value={text} onChange={(e) => updateArray('termin', idx, e.target.value)} className="flex-1 bg-slate-900/80 border-2 border-white/10 rounded-xl p-4 text-sm font-medium text-white shadow-lg focus:border-blue-500 focus:bg-slate-900 transition-all outline-none" placeholder="Contoh: DP 50% setelah PO..." />
                                <button type="button" onClick={() => removeRow('termin', idx)} className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 active:scale-95 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100"><Trash2 className="w-5 h-5 sm:w-4 sm:h-4" /></button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
