"use client";

import React from "react";
import { Edit3, Settings2, Plus, Package, RefreshCw, Database } from "lucide-react";
import { QuotationData } from "@/lib/types";
import { getNextQuotationNumber } from "@/app/actions";
import { formatQuotationNumber } from "@/lib/utils";

interface UmumSectionProps {
    data: QuotationData;
    setData: React.Dispatch<React.SetStateAction<QuotationData>>;
    nomorUrut: number;
    setNomorUrut: (n: number) => void;
}

export default function UmumSection({
    data, setData, nomorUrut, setNomorUrut
}: UmumSectionProps) {
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [clients, setClients] = React.useState<any[]>([]);
    const [showClients, setShowClients] = React.useState(false);
    const [clientLoading, setClientLoading] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const loadClients = async () => {
        setClientLoading(true);
        try {
            const res = await fetch("/api/clients/list");
            const d = await res.json();
            if (d.success) setClients(d.clients);
        } catch (e) { console.error(e); }
        setClientLoading(false);
    };

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowClients(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handlePickClient = (c: any) => {
        setData(prev => ({
            ...prev,
            namaKlien: c.companyName || c.clientName,
            companyName: c.companyName,
            clientName: c.clientName,
            up: c.clientName,
            lokasi: c.address
        }));
        setShowClients(false);
    };

    const handleSyncNumber = async () => {
        setIsSyncing(true);
        const res = await getNextQuotationNumber();
        if (res.success && res.nextUrut) {
            setNomorUrut(res.nextUrut);
            setData({ ...data, nomorUrut: res.nextUrut, nomorSurat: formatQuotationNumber(res.nextUrut) });
        }
        setIsSyncing(false);
    };

    const setMode = (mode: 'standard' | 'jasabahan' | 'material' | 'satuan') => {
        setData(prev => ({
            ...prev,
            isJasaBahanMode: mode === 'jasabahan',
            isMaterialOnlyMode: mode === 'material',
            isHargaSatuanMode: mode === 'satuan',
            // Reset items if switching to jasabahan to ensure fields exist
            items: (prev.items || []).map(item => ({
                ...item,
                hargaBahan: item.hargaBahan || 0,
                hargaJasa: item.hargaJasa || 0
            }))
        }));
    };

    const currentMode = data.isJasaBahanMode ? 'jasabahan' : 
                      data.isMaterialOnlyMode ? 'material' : 
                      data.isHargaSatuanMode ? 'satuan' : 'standard';

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {/* CARD 1: IDENTITAS */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
                    <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><Edit3 className="w-5 h-5"/></div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Identitas Penawaran</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="relative group">
                        <label className="block text-[10px] font-black text-blue-600 uppercase mb-1 flex justify-between">
                            Urut
                            <button 
                                onClick={handleSyncNumber}
                                disabled={isSyncing}
                                className="hover:text-blue-800 transition-colors"
                                title="Sinkronkan dengan nomor terakhir di database"
                            >
                                <RefreshCw className={`w-2.5 h-2.5 ${isSyncing ? 'animate-spin' : ''}`} />
                            </button>
                        </label>
                        <input 
                            type="number" 
                            value={nomorUrut} 
                            onChange={(e) => {
                                const val = Number(e.target.value) || 1;
                                setNomorUrut(val);
                                setData({ ...data, nomorUrut: val, nomorSurat: formatQuotationNumber(val) });
                            }} 
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-center outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">No. Surat Full (Editable)</label>
                        <input 
                            type="text" 
                            value={data.nomorSurat || ""} 
                            onChange={(e) => setData({ ...data, nomorSurat: e.target.value })} 
                            className="w-full p-2 border border-slate-200 rounded-xl text-xs font-bold bg-white outline-none focus:ring-2 focus:ring-blue-500" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1 flex justify-between">
                            Tanggal Dokumen
                            <button 
                                onClick={() => setData({ ...data, tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) })}
                                className="text-blue-500 hover:text-blue-700 text-[8px] font-black uppercase tracking-widest"
                            >
                                Hari Ini
                            </button>
                        </label>
                        <input 
                            type="text" 
                            value={data.tanggal || ""} 
                            placeholder="Contoh: 12 Januari 2026"
                            onChange={(e) => setData({ ...data, tanggal: e.target.value })} 
                            className="w-full p-3 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:bg-white shadow-inner outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex justify-between items-center mb-1 ml-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Penerima Dokumen <span className="text-red-400 font-normal ml-1 lowercase">(Minimal isi salah satu)</span>
                        </label>
                        <button 
                            onClick={() => {
                                setShowClients(!showClients);
                                if (clients.length === 0) loadClients();
                            }}
                            className="text-[9px] font-black text-blue-500 hover:text-blue-700 uppercase tracking-tighter flex items-center gap-1"
                        >
                            <Database className="w-2.5 h-2.5" />
                            Database Klien
                        </button>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <input 
                            type="text" 
                            placeholder="Nama Perusahaan (Opsional jika U.P. diisi)..." 
                            value={data.namaKlien || ""} 
                            onFocus={() => {
                                setShowClients(true);
                                if (clients.length === 0) loadClients();
                            }}
                            onChange={(e) => setData({ ...data, namaKlien: e.target.value })} 
                            className={`w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-base focus:bg-white shadow-inner outline-none focus:ring-2 transition-all ${!data.namaKlien && !data.up ? 'ring-1 ring-red-200 focus:ring-red-500' : 'focus:ring-blue-500'}`} 
                        />

                        {showClients && clients.length > 0 && (
                            <div className="absolute z-[60] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="p-2 mb-1 border-b border-slate-50 flex justify-between items-center">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pilih Klien Terdaftar</p>
                                    {clientLoading && <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-500" />}
                                </div>
                                <div className="space-y-1">
                                    {clients.filter(c => 
                                        !data.namaKlien || 
                                        (c.companyName || "").toLowerCase().includes(data.namaKlien.toLowerCase()) ||
                                        (c.clientName || "").toLowerCase().includes(data.namaKlien.toLowerCase())
                                    ).map((c, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => handlePickClient(c)}
                                            className="p-3 hover:bg-blue-600 group rounded-xl cursor-pointer transition-all border border-transparent hover:border-blue-400"
                                        >
                                            <p className="text-xs font-black text-slate-800 group-hover:text-white">{c.companyName || c.clientName}</p>
                                            <p className="text-[10px] text-slate-500 group-hover:text-blue-100 truncate">{c.address}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                        <input 
                            type="text" 
                            placeholder="U.P. / Nama Penerima (Opsional jika PT diisi)..." 
                            value={data.up || ""} 
                            onChange={(e) => setData({ ...data, up: e.target.value })} 
                            className={`w-full p-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:bg-white shadow-inner outline-none focus:ring-2 transition-all ${!data.namaKlien && !data.up ? 'ring-1 ring-red-200 focus:ring-red-500' : 'focus:ring-blue-500'}`} 
                        />
                        <input 
                            type="text" 
                            placeholder="Lokasi Proyek..." 
                            value={data.lokasi || ""} 
                            onChange={(e) => setData({ ...data, lokasi: e.target.value })} 
                            className="w-full p-3.5 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:bg-white shadow-inner outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        />
                    </div>
                </div>
            </div>

            {/* CARD 2: FORMAT DOKUMEN (PENTING) */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-2">
                    <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600"><Settings2 className="w-5 h-5"/></div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Format & Tampilan</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Pilih template penawaran yang sesuai</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setMode('standard')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${currentMode === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${currentMode === 'standard' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}><Edit3 className="w-4 h-4" /></div>
                        <p className="text-[11px] font-black uppercase text-slate-700">Total Standar</p>
                        <p className="text-[9px] text-slate-400 mt-1">Satu kolom harga total per item.</p>
                    </button>

                    <button 
                        onClick={() => setMode('jasabahan')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${currentMode === 'jasabahan' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${currentMode === 'jasabahan' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}><Settings2 className="w-4 h-4" /></div>
                        <p className="text-[11px] font-black uppercase text-slate-700">Pisah Jasa & Bahan</p>
                        <p className="text-[9px] text-slate-400 mt-1">Dua kolom: Harga Bahan & Harga Jasa.</p>
                    </button>

                    <button 
                        onClick={() => setMode('material')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${currentMode === 'material' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${currentMode === 'material' ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-400'}`}><Package className="w-4 h-4" /></div>
                        <p className="text-[11px] font-black uppercase text-slate-700">Material Only</p>
                        <p className="text-[9px] text-slate-400 mt-1">Khusus pengadaan barang saja.</p>
                    </button>

                    <button 
                        onClick={() => setMode('satuan')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${currentMode === 'satuan' ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50 opacity-60 hover:opacity-100'}`}
                    >
                        <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${currentMode === 'satuan' ? 'bg-purple-500 text-white' : 'bg-slate-200 text-slate-400'}`}><Plus className="w-4 h-4" /></div>
                        <p className="text-[11px] font-black uppercase text-slate-700">Hanya Satuan</p>
                        <p className="text-[9px] text-slate-400 mt-1">Tanpa kolom volume dan total akhir.</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
