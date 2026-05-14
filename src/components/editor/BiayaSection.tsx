"use client";

import React from "react";
import { Settings2, ToggleRight, ToggleLeft, Percent } from "lucide-react";
import { QuotationData } from "@/lib/types";
import { formatCurrency, formatInputNumber, parseInputNumber } from "@/lib/utils";

interface BiayaSectionProps {
    data: QuotationData;
    setData: React.Dispatch<React.SetStateAction<QuotationData>>;
    subTotal: number;
    total: number;
}

export default function BiayaSection({
    data, setData, subTotal, total
}: BiayaSectionProps) {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 font-['Outfit',sans-serif]">
            <div className="bg-slate-800/50 p-8 rounded-[40px] border border-white/5 shadow-xl space-y-8 backdrop-blur-sm">
                
                {/* Bagian Pajak */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 italic">Pengaturan Pajak</label>
                    <div className="flex items-center justify-between p-5 bg-slate-900/80 border-2 border-white/10 rounded-3xl text-white shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${data.kenakanPPN ? 'bg-blue-600 shadow-lg shadow-blue-900/50' : 'bg-slate-900 border border-white/5'}`}>
                                {data.kenakanPPN ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7 text-slate-700" />}
                            </div>
                            <div>
                                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Pajak Negara</div>
                                <div className="text-sm font-bold">Kenakan PPN (11%)</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setData({ ...data, kenakanPPN: !data.kenakanPPN })} 
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${data.kenakanPPN ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/40' : 'bg-slate-900 border border-white/5 text-slate-600 hover:text-white'}`}
                        >
                            {data.kenakanPPN ? 'AKTIF' : 'NON-AKTIF'}
                        </button>
                    </div>
                </div>

                {/* Ringkasan Biaya */}
                {!data.isHargaSatuanMode ? (
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 italic">Ringkasan Total</label>
                        <div className="bg-slate-900/80 p-8 rounded-[32px] border-2 border-white/10 space-y-5 shadow-lg">
                            <div className="flex justify-between items-center text-slate-500">
                                <span className="text-[11px] font-black uppercase tracking-widest">Subtotal Pekerjaan</span>
                                <span className="text-base font-bold text-slate-300">{formatCurrency(subTotal)}</span>
                            </div>
                            
                            <div className="flex justify-between items-center py-4 border-y border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-900/20 text-red-500 flex items-center justify-center border border-red-900/30"><Percent className="w-4 h-4"/></div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Potongan Diskon</span>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500/50">Rp</span>
                                    <input 
                                        type="text" 
                                        value={data.diskon === 0 ? '' : formatInputNumber(data.diskon)} 
                                        onChange={(e) => setData(prev => ({ ...prev, diskon: parseInputNumber(e.target.value) }))} 
                                        className="w-44 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm pl-8 pr-4 py-3 text-right font-black text-red-500 outline-none focus:border-red-500 transition-all shadow-md" 
                                        placeholder="0" 
                                    />
                                </div>
                            </div>

                            {data.kenakanPPN && (
                                <div className="flex justify-between items-center text-blue-400">
                                    <span className="text-[11px] font-black uppercase tracking-widest">PPN (11%)</span>
                                    <span className="text-base font-bold">{formatCurrency((subTotal - (data.diskon || 0)) * 0.11)}</span>
                                </div>
                            )}

                            <div className="pt-4 flex justify-between items-end">
                                <div>
                                    <div className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em] mb-1">Total Akhir</div>
                                    <div className="text-[9px] text-slate-700 italic">Nilai yang akan tertera di dokumen PDF</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-white tracking-tighter">{formatCurrency(total)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 bg-slate-950 rounded-[40px] border-2 border-dashed border-white/5 text-center space-y-3">
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-900/40"><Settings2 className="w-8 h-8"/></div>
                        <h4 className="text-sm font-black uppercase text-white tracking-widest">Mode Harga Satuan</h4>
                        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">Dalam mode ini, dokumen tidak menampilkan total harga akhir. Nilai biaya diatur per item pekerjaan.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
