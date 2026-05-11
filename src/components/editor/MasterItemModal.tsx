"use client";

import React, { useState } from "react";
import { Search, Trash2, X } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface MasterItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    masterItems: any[];
    onPick: (item: any) => void;
    onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}

export default function MasterItemModal({
    isOpen, onClose, masterItems, onPick, onDelete
}: MasterItemModalProps) {
    const [search, setSearch] = useState('');

    if (!isOpen) return null;

    const filtered = masterItems.filter(m => 
        m.deskripsi.toLowerCase().includes(search.toLowerCase()) ||
        (m.bahan || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-slate-100 bg-white flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Cari item pekerjaan..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-slate-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-all"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                            <p className="text-xs font-bold uppercase tracking-widest">Item tidak ditemukan</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2 p-2">
                            {filtered.map(m => (
                                <div key={m.id} className="p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-400 hover:shadow-md cursor-pointer transition-all flex justify-between items-center group relative">
                                    <div className="flex-1" onClick={() => onPick(m)}>
                                        <p className="text-xs font-black text-slate-800 uppercase">{m.deskripsi}</p>
                                        <p className="text-[10px] text-slate-500 italic truncate max-w-[300px]">{m.bahan || 'Tanpa Spesifikasi Bahan'}</p>
                                        <div className="mt-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Harga Default: </span>
                                            <span className="text-xs font-black text-emerald-600">{formatCurrency(m.harga)} <span className="text-[10px] text-slate-400 font-normal">/ {m.satuan}</span></span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => onDelete(e, m.id, m.deskripsi)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                                        title="Hapus dari Master"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
