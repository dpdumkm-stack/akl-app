"use client";

import React from "react";
import { Search, BookmarkPlus, Trash2, ChevronUp, ChevronDown, X, Copy } from "lucide-react";
import { QuotationItem, QuotationData } from "@/lib/types";
import { formatInputNumber, parseInputNumber } from "@/lib/utils";

interface ItemRowProps {
    item: QuotationItem;
    data: QuotationData;
    onUpdate: (id: string, field: string, value: any) => void;
    onMove: (id: string, direction: 'up' | 'down') => void;
    onDelete: (id: string) => void;
    onOpenMaster: (id: string) => void;
    onSaveMaster: (item: QuotationItem, asNew?: boolean) => void;
    onDetachMaster: (id: string) => void;
}

export default function ItemRow({
    item, data, onUpdate, onMove, onDelete, onOpenMaster, onSaveMaster, onDetachMaster
}: ItemRowProps) {
    const capitalizeWords = (str: string) => {
        return str.replace(/\b\w/g, l => l.toUpperCase());
    };
    return (
        <div className="group p-6 bg-slate-800/40 rounded-[32px] relative border border-white/5 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300 font-['Outfit',sans-serif]">
            {/* Action Toolbar */}
            <div className="absolute -top-3 right-4 sm:right-6 flex gap-1.5 sm:gap-2 z-10 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    type="button" 
                    onClick={() => onOpenMaster(item.id)} 
                    className="bg-blue-600 text-white px-2.5 sm:px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-blue-500 transition-all scale-90 sm:scale-90 hover:scale-100 border border-white/10"
                >
                    <Search className="w-3 h-3" />
                    <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-tighter">DB</span>
                </button>
                
                {item.masterId ? (
                    <>
                        <button 
                            type="button" 
                            onClick={() => onSaveMaster(item)} 
                            className="bg-orange-600 text-white p-1.5 sm:px-3 sm:py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-orange-500 transition-all scale-90 hover:scale-100 border border-white/10"
                        >
                            <BookmarkPlus className="w-3 h-3" />
                            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-tighter">Update</span>
                        </button>
                    </>
                ) : (
                    <button 
                        type="button" 
                        onClick={() => onSaveMaster(item)} 
                        className="bg-emerald-600 text-white p-1.5 sm:px-3 sm:py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-emerald-500 transition-all scale-90 hover:scale-100 border border-white/10"
                    >
                        <BookmarkPlus className="w-3 h-3" />
                        <span className="hidden sm:inline text-[9px] font-black uppercase tracking-tighter">Master</span>
                    </button>
                )}

                <button 
                    type="button" 
                    onClick={() => onDelete(item.id)} 
                    className="bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-500 transition-all scale-90 hover:scale-100 border border-white/10"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex flex-row sm:flex-col gap-1 pr-0 sm:pr-3 border-b sm:border-b-0 sm:border-r border-white/5 pb-2 sm:pb-0 justify-center sm:justify-start">
                    <button type="button" onClick={() => onMove(item.id, 'up')} className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"><ChevronUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => onMove(item.id, 'down')} className="p-1.5 text-slate-600 hover:text-blue-400 hover:bg-white/5 rounded-lg transition-all"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                        <textarea 
                            rows={1} 
                            value={item.deskripsi || ''} 
                            onChange={(e) => onUpdate(item.id, 'deskripsi', capitalizeWords(e.target.value))} 
                            className="w-full bg-transparent border-none font-black text-sm sm:text-base p-0 focus:ring-0 text-white resize-none outline-none placeholder:text-slate-600 tracking-tight" 
                            placeholder={data.isMaterialOnlyMode ? "NAMA MATERIAL..." : "NAMA PEKERJAAN..."} 
                        />
                        
                        {item.masterId && (
                            <div className="flex items-center gap-1.5">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-900/20 text-orange-400 rounded-md border border-orange-900/30">
                                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Database</span>
                                </div>
                                <button 
                                    onClick={() => onDetachMaster(item.id)}
                                    className="p-1 text-slate-600 hover:text-red-400 transition-all"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <div className="h-[2px] w-4 bg-blue-600 rounded-full opacity-50"></div>
                            <input 
                                value={item.bahan || ''} 
                                onChange={(e) => onUpdate(item.id, 'bahan', capitalizeWords(e.target.value))} 
                                className="w-full bg-transparent border-none text-[10px] sm:text-[11px] italic p-0 focus:ring-0 text-slate-400 placeholder:text-slate-600 font-medium" 
                                placeholder="Spesifikasi / Detail bahan..." 
                            />
                        </div>
                    </div>

                    <div className={`grid gap-3 pt-3 border-t border-white/5 ${
                        data.isJasaBahanMode 
                            ? (data.isHargaSatuanMode ? 'grid-cols-1 sm:grid-cols-[0.8fr_1.2fr_1.2fr]' : 'grid-cols-2 sm:grid-cols-[0.7fr_0.7fr_1.3fr_1.3fr]') 
                            : (data.isHargaSatuanMode ? 'grid-cols-1 sm:grid-cols-[1fr_1.5fr]' : 'grid-cols-2 sm:grid-cols-[0.8fr_0.8fr_1.4fr]')
                    }`}>
                        {!data.isHargaSatuanMode && (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block px-1">{data.isMaterialOnlyMode ? 'QTY' : 'Volume'}</label>
                                <input type="number" onWheel={(e) => e.currentTarget.blur()} value={item.volume || ''} onChange={(e) => onUpdate(item.id, 'volume', e.target.value)} className="w-full bg-slate-900/80 border-2 border-white/10 rounded-xl text-xs p-2.5 font-black text-white outline-none focus:border-blue-500 focus:bg-slate-900 transition-all shadow-lg" placeholder="0" />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-600 tracking-widest block px-1">Satuan</label>
                            <div className="relative">
                                <select 
                                    value={item.satuan || ''} 
                                    onChange={(e) => onUpdate(item.id, 'satuan', e.target.value)} 
                                    className="w-full bg-slate-900/80 border-2 border-white/10 rounded-xl text-xs p-2.5 font-black text-white outline-none focus:border-blue-500 focus:bg-slate-900 transition-all shadow-lg appearance-none pr-8"
                                >
                                    <option value="" className="bg-slate-900">Pilih...</option>
                                    <optgroup label="Standar Proyek" className="bg-slate-900">
                                        <option value="m²">m² (Meter Persegi)</option>
                                        <option value="m¹">m¹ (Meter Lari)</option>
                                        <option value="m³">m³ (Meter Kubik)</option>
                                        <option value="Ls">Ls (Lump Sum)</option>
                                        <option value="Lot">Lot</option>
                                        <option value="Titik">Titik</option>
                                        <option value="Set">Set</option>
                                    </optgroup>
                                    <optgroup label="Waktu" className="bg-slate-900">
                                        <option value="Days">Days</option>
                                        <option value="Hari">Hari</option>
                                    </optgroup>
                                    <optgroup label="Satuan Barang" className="bg-slate-900">
                                        <option value="Pcs">Pcs</option>
                                        <option value="Ltr">Liter</option>
                                        <option value="Kg">Kilogram</option>
                                        <option value="Zak">Zak</option>
                                        <option value="Pail">Pail</option>
                                        <option value="Roll">Roll</option>
                                        <option value="Btg">Batang</option>
                                        <option value="Lembar">Lembar</option>
                                        <option value="Box">Box</option>
                                    </optgroup>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-3 h-3 text-slate-600" />
                                </div>
                            </div>
                        </div>

                        {data.isJasaBahanMode ? (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest block px-1 italic">Harga Bahan</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-600/50">Rp</span>
                                        <input type="text" value={item.hargaBahan === 0 ? '' : formatInputNumber(item.hargaBahan)} onChange={(e) => onUpdate(item.id, 'hargaBahan', parseInputNumber(e.target.value))} className="w-full bg-slate-900/80 border-2 border-white/10 rounded-xl text-[11px] pl-6 pr-2 py-2.5 font-black text-right text-emerald-400 outline-none focus:border-emerald-500 focus:bg-slate-900 transition-all shadow-lg" placeholder="0" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest block px-1 italic">Harga Jasa</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-600/50">Rp</span>
                                        <input type="text" value={item.hargaJasa === 0 ? '' : formatInputNumber(item.hargaJasa)} onChange={(e) => onUpdate(item.id, 'hargaJasa', parseInputNumber(e.target.value))} className="w-full bg-slate-900/80 border-2 border-white/10 rounded-xl text-[11px] pl-6 pr-2 py-2.5 font-black text-right text-blue-400 outline-none focus:border-blue-500 focus:bg-slate-900 transition-all shadow-lg" placeholder="0" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest block px-1 italic">Harga Satuan</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-600/50">Rp</span>
                                    <input type="text" value={item.harga === 0 ? '' : formatInputNumber(item.harga)} onChange={(e) => onUpdate(item.id, 'harga', parseInputNumber(e.target.value))} className="w-full bg-slate-900/80 border-2 border-white/10 rounded-xl text-xs pl-8 pr-3 py-2.5 font-black text-right text-blue-400 outline-none focus:border-blue-500 focus:bg-slate-900 transition-all shadow-lg" placeholder="0" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
