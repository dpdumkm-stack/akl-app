"use client";

import React, { useState, useEffect } from "react";
import { Search, X, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { searchQuotations } from "@/app/actions";
import { formatCurrency } from "@/lib/utils";

interface InvoiceImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (quotationData: any) => void;
}

export default function InvoiceImportModal({ isOpen, onClose, onImport }: InvoiceImportModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Initial load: fetch recent quotations
    useEffect(() => {
        if (isOpen) {
            handleSearch("");
        } else {
            // Reset when closed
            setQuery("");
            setResults([]);
            setHasSearched(false);
        }
    }, [isOpen]);

    const handleSearch = async (searchQuery: string) => {
        setIsLoading(true);
        try {
            const res = await searchQuotations(searchQuery);
            if (res.success && res.data) {
                setResults(res.data);
            }
        } catch (error) {
            console.error("Failed to search quotations:", error);
        } finally {
            setIsLoading(false);
            setHasSearched(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSearch(query);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-3xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 bg-slate-900/50">
                    <div>
                        <h3 className="text-lg font-black text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            IMPOR DARI PENAWARAN
                        </h3>
                        <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            Tarik data dari penawaran untuk mempercepat pembuatan invoice
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-6 border-b border-white/5 bg-slate-950/50">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Cari No. Penawaran atau Nama Klien..." 
                            className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-12 pr-24 py-4 text-white font-bold text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-600"
                        />
                        <button
                            onClick={() => handleSearch(query)}
                            disabled={isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cari
                        </button>
                    </div>
                </div>

                {/* Results Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                            <p className="text-xs font-bold uppercase tracking-widest">Mencari Data...</p>
                        </div>
                    ) : results.length === 0 && hasSearched ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-center">
                            <Search className="w-8 h-8 mb-4 opacity-50" />
                            <p className="text-xs font-bold uppercase tracking-widest">Data Penawaran tidak ditemukan</p>
                            <p className="text-[10px] mt-2">Coba gunakan kata kunci lain</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.map((q) => (
                                <div 
                                    key={q.id}
                                    className="group bg-slate-950 border border-white/5 hover:border-blue-500/50 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-900/20 flex flex-col"
                                    onClick={() => onImport(q)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <span className="inline-block px-2 py-1 bg-blue-500/10 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded mb-2">
                                                {q.nomorSurat}
                                            </span>
                                            <h4 className="text-white font-black text-sm line-clamp-1">
                                                {q.companyName || q.namaKlien || 'Klien Tanpa Nama'}
                                            </h4>
                                            {q.up && <p className="text-slate-400 text-xs font-medium mt-1">U.P: {q.up}</p>}
                                        </div>
                                        {q.isInvoiced && (
                                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-[9px] font-black flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> INVOICED
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="mt-auto pt-4 border-t border-white/5 flex flex-col gap-1">
                                        <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                            <span>{new Date(q.createdAt).toLocaleDateString('id-ID')}</span>
                                            <span>{q.items?.length || 0} Item</span>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Estimasi</span>
                                            <span className="text-blue-400 font-black text-sm">{formatCurrency(q.totalHarga || 0)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
