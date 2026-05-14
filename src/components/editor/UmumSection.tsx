"use client";

import React from "react";
import { Edit3, Settings2, Plus, Package, RefreshCw, Database, Search } from "lucide-react";
import { QuotationData } from "@/lib/types";
import { getNextQuotationNumber } from "@/app/actions";
import { formatQuotationNumber, formatCurrency } from "@/lib/utils";

interface UmumSectionProps {
    data: QuotationData;
    setData: React.Dispatch<React.SetStateAction<QuotationData>>;
    nomorUrut: number;
    setNomorUrut: (n: number) => void;
    showToast: (msg: string, type?: 'success' | 'error') => void;
}

const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, l => l.toUpperCase());
};

const allCaps = (str: string) => str.toUpperCase();

export default function UmumSection({
    data, setData, nomorUrut, setNomorUrut, showToast
}: UmumSectionProps) {
    const [isSyncing, setIsSyncing] = React.useState(false);
    const [clients, setClients] = React.useState<any[]>([]);
    const [showClients, setShowClients] = React.useState(false);
    const [clientLoading, setClientLoading] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    const [clientSearch, setClientSearch] = React.useState("");

    const loadClients = async () => {
        setClientLoading(true);
        try {
            const res = await fetch("/api/clients/list");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const ct = res.headers.get("content-type");
            if (ct && ct.includes("application/json")) {
                const d = await res.json();
                if (d.success) setClients(d.clients);
            } else {
                console.error("API /list returned non-JSON response");
            }
        } catch (e) { 
            console.error("Gagal load clients:", e); 
        }
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

    const handlePickClient = async (c: any) => {
        setData(prev => ({
            ...prev,
            namaKlien: c.companyName || c.clientName,
            companyName: c.companyName,
            clientName: c.clientName,
            up: c.clientName,
            lokasi: c.address
        }));
        setShowClients(false);
        setClientSearch("");

        // Fetch History Stats
        try {
            const res = await fetch(`/api/clients/history?companyName=${encodeURIComponent(c.companyName || "")}&clientName=${encodeURIComponent(c.clientName || "")}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            
            const ct = res.headers.get("content-type");
            if (ct && ct.includes("application/json")) {
                const d = await res.json();
                if (d.success) {
                    const { pendingQuotations, paidInvoices, pendingInvoices } = d.stats;
                    showToast(
                        `📊 Info Klien: ${pendingQuotations} Penawaran, ${paidInvoices} Lunas, ${pendingInvoices} Pending.`,
                        "success"
                    );
                }
            }
        } catch (e) {
            console.error("Gagal ambil history:", e);
        }
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

    const { totalBahan, totalJasa } = React.useMemo(() => {
        let b = 0;
        let j = 0;
        (data.items || []).forEach(item => {
            const vol = item.volume || 0;
            b += (item.hargaBahan || 0) * vol;
            j += (item.hargaJasa || 0) * vol;
        });
        return { totalBahan: b, totalJasa: j };
    }, [data.items]);

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6 font-['Outfit',sans-serif]">
            {/* CARD 1: IDENTITAS */}
            <div className="bg-slate-800/50 p-6 rounded-3xl shadow-xl border border-white/5 space-y-5 backdrop-blur-sm">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
                    <div className="p-2 bg-slate-950 rounded-xl text-blue-500 border border-white/5"><Edit3 className="w-5 h-5"/></div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Identitas Penawaran</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 rounded-2xl border border-white/5 shadow-inner">
                    <div className="relative group">
                        <label className="block text-[10px] font-black text-blue-500 uppercase mb-1 flex justify-between">
                            Urut
                            <button 
                                onClick={handleSyncNumber}
                                disabled={isSyncing}
                                className="hover:text-blue-400 transition-colors"
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
                            className="w-full p-2.5 bg-slate-900/80 border-2 border-white/10 rounded-xl text-sm font-black text-center text-white outline-none focus:border-blue-500 focus:bg-slate-900 transition-all shadow-lg" 
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">No. Surat Full (Editable)</label>
                        <input 
                            type="text" 
                            value={data.nomorSurat || ""} 
                            onChange={(e) => setData({ ...data, nomorSurat: e.target.value })} 
                            className="w-full p-2.5 border-2 border-white/10 rounded-xl text-xs font-black bg-slate-900/80 text-white outline-none focus:border-blue-500 focus:bg-slate-900 transition-all shadow-lg" 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    <div className="relative">
                        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 ml-1 flex justify-between">
                            Tanggal Dokumen
                            <button 
                                onClick={() => setData({ ...data, tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) })}
                                className="text-blue-500 hover:text-blue-400 text-[8px] font-black uppercase tracking-widest"
                            >
                                Hari Ini
                            </button>
                        </label>
                        <input 
                            type="text" 
                            value={data.tanggal || ""} 
                            placeholder="Contoh: 12 Januari 2026"
                            onChange={(e) => setData({ ...data, tanggal: capitalizeWords(e.target.value) })} 
                            className="w-full p-3.5 bg-slate-900/80 border-2 border-white/10 rounded-2xl text-xs font-black text-white shadow-lg outline-none focus:border-blue-500 focus:bg-slate-900 transition-all" 
                        />
                    </div>
                </div>
            </div>

            {/* CARD 2: DETIL KLIEN (INTELLIGENCE HUB) */}
            <div className="bg-slate-800/50 p-6 rounded-3xl shadow-xl border border-white/5 space-y-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="p-2 bg-slate-950 rounded-xl text-blue-500 border border-white/5"><Package className="w-5 h-5"/></div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Penerima Dokumen</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 italic">Isi manual atau pilih dari database klien</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* LEFT PANEL: MANUAL INPUT */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informasi Utama</h4>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="relative group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nama Perusahaan</label>
                                <input 
                                    type="text" 
                                    placeholder="PT. Contoh Indonesia..." 
                                    value={data.namaKlien || ""} 
                                    onChange={(e) => {
                                        const val = allCaps(e.target.value);
                                        setData({ ...data, namaKlien: val, companyName: val, clientName: val });
                                    }} 
                                    className={`w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl font-black text-base text-white shadow-lg outline-none focus:border-blue-500 focus:bg-slate-950 transition-all ${!data.namaKlien && !data.up ? 'ring-2 ring-red-500/20' : ''}`} 
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">U.P. (Nama Penerima)</label>
                                    <input 
                                        type="text" 
                                        placeholder="Bapak/Ibu..." 
                                        value={data.up || ""} 
                                        onChange={(e) => setData({ ...data, up: capitalizeWords(e.target.value) })} 
                                        className={`w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-white shadow-lg outline-none focus:border-blue-500 focus:bg-slate-950 transition-all ${!data.namaKlien && !data.up ? 'ring-2 ring-red-500/20' : ''}`} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Lokasi Proyek</label>
                                    <input 
                                        type="text" 
                                        placeholder="Jakarta Selatan..." 
                                        value={data.lokasi || ""} 
                                        onChange={(e) => setData({ ...data, lokasi: capitalizeWords(e.target.value) })} 
                                        className="w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-white shadow-lg outline-none focus:border-blue-500 focus:bg-slate-950 transition-all" 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL: DATABASE ASSISTANT */}
                    <div className="bg-slate-900/50 p-5 rounded-3xl border-2 border-dashed border-white/5 flex flex-col h-full min-h-[300px]">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Database className="w-3.5 h-3.5 text-blue-500" />
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Database Assistant</h4>
                            </div>
                            {clientLoading && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
                        </div>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input 
                                type="text" 
                                placeholder="Cari klien di database..." 
                                value={clientSearch}
                                onFocus={() => {
                                    setShowClients(true);
                                    if (clients.length === 0) loadClients();
                                }}
                                onChange={e => {
                                    setClientSearch(e.target.value);
                                    setShowClients(true);
                                    if (clients.length === 0) loadClients();
                                }}
                                className="w-full pl-10 pr-4 py-3 bg-slate-950 border-2 border-white/10 rounded-xl text-xs font-black text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2 max-h-[250px]">
                            {clients.length === 0 && !clientLoading ? (
                                <div className="flex flex-col items-center justify-center h-full opacity-30 py-8">
                                    <Database className="w-8 h-8 mb-2" />
                                    <p className="text-[9px] font-black uppercase tracking-widest text-center">Belum ada data klien</p>
                                </div>
                            ) : (
                                <>
                                    {clients.filter(c => {
                                        const query = (clientSearch || "").toLowerCase();
                                        return (c.companyName || "").toLowerCase().includes(query) ||
                                               (c.clientName || "").toLowerCase().includes(query);
                                    }).length === 0 ? (
                                        <div className="p-4 text-center text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                            Tidak ditemukan
                                        </div>
                                    ) : (
                                        clients.filter(c => {
                                            const query = (clientSearch || "").toLowerCase();
                                            return (c.companyName || "").toLowerCase().includes(query) ||
                                                   (c.clientName || "").toLowerCase().includes(query);
                                        }).map((c, i) => (
                                            <div 
                                                key={i} 
                                                onClick={() => handlePickClient(c)}
                                                className="p-3 bg-slate-950/50 hover:bg-blue-600 group rounded-xl cursor-pointer transition-all border border-white/5 hover:border-blue-400"
                                            >
                                                <p className="text-xs font-black text-white group-hover:text-white uppercase truncate">{c.companyName || c.clientName}</p>
                                                <p className="text-[9px] text-slate-500 group-hover:text-blue-100 truncate mt-0.5 font-bold italic">{c.address}</p>
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                        </div>

                        <p className="text-[8px] text-slate-600 font-black uppercase tracking-tighter mt-4 text-center italic">Klik pada nama untuk mengisi form secara otomatis</p>
                    </div>
                </div>
            </div>

            {/* CARD 3: FORMAT DOKUMEN */}
            <div className="bg-slate-800/50 p-6 rounded-3xl shadow-xl border border-white/5 space-y-4 backdrop-blur-sm">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-2">
                    <div className="p-2 bg-slate-950 rounded-xl text-emerald-500 border border-white/5"><Settings2 className="w-5 h-5"/></div>
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-white">Format & Tampilan</h3>
                        <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5 italic">Pilih template penawaran yang sesuai</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setMode('standard')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${currentMode === 'standard' ? 'border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-900/20' : 'border-white/5 bg-slate-950 opacity-60 hover:opacity-100 hover:border-white/20'}`}
                    >
                        <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${currentMode === 'standard' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}><Edit3 className="w-4 h-4" /></div>
                        <p className={`text-[11px] font-black uppercase ${currentMode === 'standard' ? 'text-white' : 'text-slate-500'}`}>Total Standar</p>
                        <p className="text-[9px] text-slate-600 mt-1 font-medium">Satu kolom harga total per item.</p>
                    </button>

                    <button 
                        onClick={() => setMode('jasabahan')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${currentMode === 'jasabahan' ? 'border-blue-500 bg-blue-600/10 shadow-lg shadow-blue-900/20' : 'border-white/5 bg-slate-950 opacity-60 hover:opacity-100 hover:border-white/20'}`}
                    >
                        <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${currentMode === 'jasabahan' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}><Settings2 className="w-4 h-4" /></div>
                        <p className={`text-[11px] font-black uppercase ${currentMode === 'jasabahan' ? 'text-white' : 'text-slate-500'}`}>Pisah Jasa & Bahan</p>
                        <p className="text-[9px] text-slate-600 mt-1 font-medium">Dua kolom: Harga Bahan & Harga Jasa.</p>
                        
                        {(totalBahan > 0 || totalJasa > 0) && (
                            <div className="mt-3 pt-3 border-t border-white/10 space-y-1 animate-in fade-in slide-in-from-top-1 duration-500">
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Total Bahan</span>
                                    <span className="text-[9px] font-black text-emerald-400">{formatCurrency(totalBahan)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Total Upah</span>
                                    <span className="text-[9px] font-black text-blue-400">{formatCurrency(totalJasa)}</span>
                                </div>
                            </div>
                        )}
                    </button>

                    <button 
                        onClick={() => setMode('material')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${currentMode === 'material' ? 'border-orange-500 bg-orange-600/10 shadow-lg shadow-orange-900/20' : 'border-white/5 bg-slate-950 opacity-60 hover:opacity-100 hover:border-white/20'}`}
                    >
                        <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${currentMode === 'material' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-500'}`}><Package className="w-4 h-4" /></div>
                        <p className={`text-[11px] font-black uppercase ${currentMode === 'material' ? 'text-white' : 'text-slate-500'}`}>Material Only</p>
                        <p className="text-[9px] text-slate-600 mt-1 font-medium">Khusus pengadaan barang saja.</p>
                    </button>

                    <button 
                        onClick={() => setMode('satuan')}
                        className={`p-4 rounded-2xl border-2 text-left transition-all ${currentMode === 'satuan' ? 'border-purple-500 bg-purple-600/10 shadow-lg shadow-purple-900/20' : 'border-white/5 bg-slate-950 opacity-60 hover:opacity-100 hover:border-white/20'}`}
                    >
                        <div className={`w-8 h-8 rounded-full mb-3 flex items-center justify-center ${currentMode === 'satuan' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-500'}`}><Plus className="w-4 h-4" /></div>
                        <p className={`text-[11px] font-black uppercase ${currentMode === 'satuan' ? 'text-white' : 'text-slate-500'}`}>Hanya Satuan</p>
                        <p className="text-[9px] text-slate-600 mt-1 font-medium">Tanpa kolom volume dan total akhir.</p>
                    </button>
                </div>
            </div>
        </div>
    );
}
