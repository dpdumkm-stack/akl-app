"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Users, Search, Trash2, Edit2, Download, Plus, 
  ArrowLeft, FileText, Banknote, Phone, Mail, MapPin, 
  ChevronRight, Filter, TrendingUp, Briefcase
} from "lucide-react";

export default function ClientsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients/stats");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const d = await res.json();
        if (d.success) setClients(d.clients);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadClients();
  }, [status, router]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/clients/delete?id=${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const ct = res.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const d = await res.json();
        if (d.success) {
          setClients(clients.filter(c => c.id !== deleteId));
          setDeleteId(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fmt = (v: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  const filteredClients = clients.filter(c => 
    (c.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.clientName || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = clients.reduce((sum, c) => sum + (c.totalOmzet || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push("/")} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                Master Database Klien
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Customer Relationship Management</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:flex flex-col items-end mr-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Total Portfolio Nilai</p>
                <p className="text-sm font-black text-emerald-600">{fmt(totalRevenue)}</p>
             </div>
             <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>
             <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:scale-105 transition-all">
                <Plus className="w-4 h-4" /> Tambah Klien
             </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <Users className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Klien</p>
                    <p className="text-2xl font-black text-slate-800">{clients.length}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Omzet (Lunas)</p>
                    <p className="text-2xl font-black text-slate-800">{fmt(totalRevenue)}</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <FileText className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Dokumen</p>
                    <p className="text-2xl font-black text-slate-800">{clients.reduce((s, c) => s + (c.totalInvoices || 0), 0)}</p>
                </div>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Cari nama perusahaan atau nama klien..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <Filter className="w-3.5 h-3.5" /> Filter
                </button>
                <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">
                    <Download className="w-3.5 h-3.5" /> Export
                </button>
            </div>
        </div>

        {/* CLIENT LIST */}
        {loading ? (
            <div className="flex items-center justify-center py-24">
                <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        ) : filteredClients.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] py-24 text-center">
                <Users className="w-20 h-20 mx-auto text-slate-200 mb-4" />
                <h3 className="text-xl font-black text-slate-400">Data Klien Tidak Ditemukan</h3>
                <p className="text-slate-400 mt-2">Coba kata kunci lain atau tambah klien baru.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClients.map(client => (
                    <div key={client.id} className="bg-white border border-slate-200 rounded-[32px] overflow-hidden group hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-12 h-12 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                    <Briefcase className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1">
                                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => setDeleteId(client.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <h3 className="text-lg font-black text-slate-800 line-clamp-1">{client.companyName || client.clientName}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{client.clientName && client.companyName ? `U.P. ${client.clientName}` : 'Personal Client'}</p>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-slate-300 mt-0.5 shrink-0" />
                                    <p className="text-xs text-slate-500 font-semibold line-clamp-2">{client.address || 'Alamat belum diset'}</p>
                                </div>
                                
                                {/* QUICK ACTIONS MOBILE */}
                                <div className="flex gap-2 pt-2">
                                    {client.phone && (
                                        <>
                                            <a 
                                                href={`tel:${client.phone}`}
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                            >
                                                <Phone className="w-3 h-3" /> Hubungi
                                            </a>
                                            <a 
                                                href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                                            >
                                                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.438 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg> WA
                                            </a>
                                        </>
                                    )}
                                    {client.email && (
                                        <a 
                                            href={`mailto:${client.email}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest hover:bg-slate-600 hover:text-white transition-all"
                                        >
                                            <Mail className="w-3 h-3" /> Email
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Portfolio</p>
                                <p className="text-sm font-black text-emerald-600">{fmt(client.totalOmzet)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Aktivitas</p>
                                <p className="text-sm font-black text-slate-700">{client.totalInvoices} Dokumen</p>
                            </div>
                        </div>
                        
                        <button className="w-full py-3 bg-white hover:bg-blue-600 text-[10px] font-black text-blue-600 hover:text-white uppercase tracking-widest border-t border-slate-100 transition-all flex items-center justify-center gap-2">
                           Detail Transaksi <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {deleteId && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-600 mx-auto mb-4">
                    <Trash2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Hapus Klien?</h3>
                <p className="text-slate-500 text-sm mb-8">Seluruh history omzet klien ini akan hilang dari laporan. Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
                    <button onClick={handleDelete} className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 shadow-lg shadow-red-200 transition-all">Ya, Hapus</button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
}
