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
    return (
        <div className="group p-5 bg-white rounded-[32px] relative border border-slate-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
            {/* Action Toolbar */}
            <div className="absolute -top-3 right-6 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    type="button" 
                    onClick={() => onOpenMaster(item.id)} 
                    className="bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-blue-700 transition-all scale-90 hover:scale-100"
                >
                    <Search className="w-3 h-3" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">Database</span>
                </button>
                
                {item.masterId ? (
                    <>
                        <button 
                            type="button" 
                            onClick={() => onSaveMaster(item)} 
                            className="bg-orange-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-orange-600 transition-all scale-90 hover:scale-100"
                        >
                            <BookmarkPlus className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Update Master</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={() => onSaveMaster(item, true)} 
                            className="bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-blue-600 transition-all scale-90 hover:scale-100"
                            title="Simpan sebagai Item Baru di Database"
                        >
                            <Copy className="w-3 h-3" />
                            <span className="text-[9px] font-black uppercase tracking-tighter">Simpan Baru</span>
                        </button>
                    </>
                ) : (
                    <button 
                        type="button" 
                        onClick={() => onSaveMaster(item)} 
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 hover:bg-emerald-700 transition-all scale-90 hover:scale-100"
                    >
                        <BookmarkPlus className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">Simpan Master</span>
                    </button>
                )}

                <button 
                    type="button" 
                    onClick={() => onDelete(item.id)} 
                    className="bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-all scale-90 hover:scale-100"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
            
            <div className="flex gap-4">
                <div className="flex flex-col gap-1 pr-3 border-r border-slate-100 justify-center">
                    <button type="button" onClick={() => onMove(item.id, 'up')} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><ChevronUp className="w-4 h-4" /></button>
                    <button type="button" onClick={() => onMove(item.id, 'down')} className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><ChevronDown className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                        <textarea 
                            rows={1} 
                            value={item.deskripsi || ''} 
                            onChange={(e) => onUpdate(item.id, 'deskripsi', e.target.value)} 
                            className="w-full bg-transparent border-none font-black text-sm p-0 focus:ring-0 resize-none outline-none uppercase placeholder:text-slate-300 tracking-tight" 
                            placeholder={data.isMaterialOnlyMode ? "NAMA MATERIAL..." : "NAMA PEKERJAAN..."} 
                        />
                        
                        {item.masterId && (
                            <div className="flex items-center gap-1.5">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-md border border-orange-100">
                                    <div className="w-1 h-1 bg-orange-500 rounded-full animate-pulse"></div>
                                    <span className="text-[8px] font-black uppercase tracking-widest">Terhubung Database</span>
                                </div>
                                <button 
                                    onClick={() => onDetachMaster(item.id)}
                                    className="p-1 text-slate-300 hover:text-red-500 transition-all"
                                    title="Lepas dari Master (Edit Tanpa Mengubah Database)"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            <div className="h-[2px] w-4 bg-blue-500 rounded-full"></div>
                            <input 
                                value={item.bahan || ''} 
                                onChange={(e) => onUpdate(item.id, 'bahan', e.target.value)} 
                                className="w-full bg-transparent border-none text-[11px] italic p-0 focus:ring-0 text-slate-500 placeholder:text-slate-300 font-medium" 
                                placeholder="Spesifikasi / Detail bahan..." 
                            />
                        </div>
                    </div>

                    <div className={`grid gap-3 pt-3 border-t border-slate-50 ${
                        data.isJasaBahanMode 
                            ? (data.isHargaSatuanMode ? 'grid-cols-[0.8fr_1.2fr_1.2fr]' : 'grid-cols-[0.7fr_0.7fr_1.3fr_1.3fr]') 
                            : (data.isHargaSatuanMode ? 'grid-cols-[1fr_1.5fr]' : 'grid-cols-[0.8fr_0.8fr_1.4fr]')
                    }`}>
                        {!data.isHargaSatuanMode && (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">{data.isMaterialOnlyMode ? 'QTY' : 'Volume'}</label>
                                <input type="number" onWheel={(e) => e.currentTarget.blur()} value={item.volume || ''} onChange={(e) => onUpdate(item.id, 'volume', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs p-2.5 font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all shadow-inner" placeholder="0" />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block px-1">Satuan</label>
                            <div className="relative">
                                <select 
                                    value={item.satuan || ''} 
                                    onChange={(e) => onUpdate(item.id, 'satuan', e.target.value)} 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs p-2.5 font-black text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all shadow-inner appearance-none pr-8"
                                >
                                    <option value="">Pilih...</option>
                                    <optgroup label="Standar Proyek">
                                        <option value="m²">m² (Meter Persegi)</option>
                                        <option value="m¹">m¹ (Meter Lari)</option>
                                        <option value="m³">m³ (Meter Kubik)</option>
                                        <option value="Ls">Ls (Lump Sum)</option>
                                        <option value="Lot">Lot</option>
                                        <option value="Titik">Titik</option>
                                        <option value="Set">Set</option>
                                    </optgroup>
                                    <optgroup label="Satuan Barang">
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
                                    <ChevronDown className="w-3 h-3 text-slate-400" />
                                </div>
                            </div>
                        </div>

                        {data.isJasaBahanMode ? (
                            <>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block px-1">Harga Bahan</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-emerald-400">Rp</span>
                                        <input type="text" value={item.hargaBahan === 0 ? '' : formatInputNumber(item.hargaBahan)} onChange={(e) => onUpdate(item.id, 'hargaBahan', parseInputNumber(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-xl text-[11px] pl-6 pr-2 py-2.5 font-black text-right text-emerald-700 outline-none focus:bg-white focus:ring-2 focus:ring-emerald-400 transition-all shadow-inner" placeholder="0" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black text-blue-600 uppercase tracking-widest block px-1">Harga Jasa</label>
                                    <div className="relative">
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-400">Rp</span>
                                        <input type="text" value={item.hargaJasa === 0 ? '' : formatInputNumber(item.hargaJasa)} onChange={(e) => onUpdate(item.id, 'hargaJasa', parseInputNumber(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-xl text-[11px] pl-6 pr-2 py-2.5 font-black text-right text-blue-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all shadow-inner" placeholder="0" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest block px-1">Harga Satuan</label>
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-blue-400">Rp</span>
                                    <input type="text" value={item.harga === 0 ? '' : formatInputNumber(item.harga)} onChange={(e) => onUpdate(item.id, 'harga', parseInputNumber(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-xl text-xs pl-8 pr-3 py-2.5 font-black text-right text-blue-800 outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 transition-all shadow-inner" placeholder="0" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
