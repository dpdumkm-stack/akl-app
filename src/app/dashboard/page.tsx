"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FileText, Receipt, Plus, ArrowRight, Clock, CheckCircle,
  AlertCircle, TrendingUp, Users, LogOut, Settings,
  ChevronRight, Layers, Bell, Database, Printer, Eye,
  Package, Truck
} from "lucide-react";
import { convertToInvoice } from "@/app/actions";

interface QuotationSummary {
  id: string;
  nomorSurat: string;
  namaKlien: string;
  tanggal: string;
  totalHarga: number;
  isInvoiced?: boolean;
  createdAt: string;
}

interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  total: number;
  status: "PENDING" | "PAID" | "CANCELLED";
}

interface DashboardStats {
  totalQuotations: number;
  invoicedQuotations: number;
  conversionRate: number;
  totalInvoices: number;
  pendingInvoices: number;
  paidInvoices: number;
  totalRevenue: number;
  outstandingBalance: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const fmtCompact = (n: number) => {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  return fmt(n);
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotations: 0,
    invoicedQuotations: 0,
    conversionRate: 0,
    totalInvoices: 0,
    pendingInvoices: 0,
    paidInvoices: 0,
    totalRevenue: 0,
    outstandingBalance: 0,
  });
  const [recentQuotations, setRecentQuotations] = useState<QuotationSummary[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const hasLoaded = React.useRef(false);

  const loadData = useCallback(async () => {
    if (hasLoaded.current) return;
    setLoading(true);
    try {
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return { success: false };
          const ct = res.headers.get("content-type");
          if (ct && ct.includes("application/json")) {
            return await res.json();
          }
          return { success: false };
        } catch (e) {
          return { success: false };
        }
      };

      const [qRes, iRes] = await Promise.all([
        safeFetch("/api/quotations/list"),
        safeFetch("/api/invoice/list"),
      ]);

      const quotations: QuotationSummary[] = qRes.success ? qRes.quotations ?? [] : [];
      const invoices: InvoiceSummary[] = iRes.success ? iRes.invoices ?? [] : [];

      const pending = invoices.filter(i => i.status === "PENDING");
      const paid = invoices.filter(i => i.status === "PAID");
      const totalRevenue = paid.reduce((a, i) => a + i.total, 0);
      const outstandingBalance = pending.reduce((a, i) => a + i.total, 0);

      const invoicedQuotes = quotations.filter(q => q.isInvoiced).length;
      const conversionRate = quotations.length > 0 ? Math.round((invoicedQuotes / quotations.length) * 100) : 0;

      setStats({
        totalQuotations: quotations.length,
        invoicedQuotations: invoicedQuotes,
        conversionRate,
        totalInvoices: invoices.length,
        pendingInvoices: pending.length,
        paidInvoices: paid.length,
        totalRevenue,
        outstandingBalance,
      });

      setRecentQuotations(quotations.slice(0, 5));
      setRecentInvoices(invoices.slice(0, 5));
      hasLoaded.current = true;
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [systemError, setSystemError] = useState<string | null>(null);

  const handleConvertToInvoice = async (id: string, name: string) => {
    setSystemError(`Mencoba menerbitkan invoice untuk: ${name} (ID: ${id})...`);
    
    try {
      const res = await convertToInvoice(id);
      if (res.success) {
        setSystemError(`SUKSES: Invoice diterbitkan. Mengalihkan...`);
        setTimeout(() => window.location.href = "/invoice", 500);
      } else {
        const errMsg = `GAGAL: ${res.message}`;
        setSystemError(errMsg);
        window.alert(errMsg);
      }
    } catch (e: any) {
      const errMsg = `CRITICAL ERROR: ${e.message}`;
      setSystemError(errMsg);
      window.alert(errMsg);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-indigo-600/10 blur-[100px] rounded-full" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white uppercase">Studio AKL <span className="text-blue-500">v2.5</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">PT. Apindo Karya Lestari</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <button 
              onClick={() => router.push("/clients")}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-xl text-xs font-bold transition-all"
            >
              <Users className="w-3.5 h-3.5 text-blue-400" /> Database Klien
            </button>
            <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />
             <button 
              onClick={() => router.push("/settings")}
              className="p-2.5 bg-slate-900 hover:bg-blue-600 text-slate-400 hover:text-white rounded-xl border border-white/5 transition-all"
              title="Pengaturan"
            >
              <Settings className="w-4 h-4" />
            </button>
            <div className="h-8 w-px bg-white/10 mx-1 hidden md:block" />
            <button 
              onClick={() => signOut()}
              className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 md:py-12 space-y-12">
        {/* Welcome Header */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="space-y-1">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Selamat datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{session?.user?.name ?? "Administrator"}</span>
            </h2>
            <p className="text-slate-400 font-medium">Ikhtisar operasional harian Anda dalam satu tampilan.</p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
          <StatCard title="Total Penawaran" value={stats.totalQuotations} icon={<FileText className="w-5 h-5" />} color="blue" />
          <StatCard title="Tingkat Konversi" value={`${stats.conversionRate}%`} icon={<TrendingUp className="w-5 h-5" />} color="emerald" />
          <StatCard title="Invoice Terbit" value={stats.totalInvoices} icon={<Database className="w-5 h-5" />} color="indigo" />
          <StatCard title="Piutang (Pending)" value={fmtCompact(stats.outstandingBalance)} icon={<Clock className="w-5 h-5" />} color="amber" />
        </section>

        {/* 4 Pilar Utama Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          <ServiceCard 
            title="Penawaran" 
            subtitle="Buat Penawaran Baru" 
            icon={<FileText className="w-8 h-8" />} 
            color="blue" 
            onClick={() => router.push("/quotations")}
            stats={`${stats.totalQuotations} Dokumen`}
          />
          <ServiceCard 
            title="Invoice" 
            subtitle="Kelola Penagihan" 
            icon={<Receipt className="w-8 h-8" />} 
            color="emerald" 
            onClick={() => router.push("/invoice")}
            stats={`${stats.totalInvoices} Terbit`}
          />
          <ServiceCard 
            title="Purchase Order" 
            subtitle="Manajemen PO" 
            icon={<Package className="w-8 h-8" />} 
            color="amber" 
            isPlaceholder
            stats="Coming Soon"
          />
          <ServiceCard 
            title="Surat Jalan" 
            subtitle="Cetak Surat Jalan" 
            icon={<Truck className="w-8 h-8" />} 
            color="indigo" 
            isPlaceholder
            stats="Coming Soon"
          />
        </section>

        {/* Main Dashboard Layout (Refined Clean List System) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          
          {/* Recent Quotations Container */}
          <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-8 shadow-2xl backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600/10 rounded-2xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white uppercase italic">Penawaran</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Update Terbaru</p>
                </div>
              </div>
              <button onClick={() => router.push("/")} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400" />
              </button>
            </div>

            <div className="flex-1 space-y-1">
              {recentQuotations.length === 0 ? (
                <div className="py-20 text-center text-slate-600 font-medium italic">Belum ada penawaran terbaru.</div>
              ) : recentQuotations.map((q, idx) => (
                <div 
                  key={q.id} 
                  onClick={() => router.push(`/quotations/edit/${q.id}`)}
                  className={`flex items-center justify-between p-4 hover:bg-white/[0.03] rounded-2xl transition-all group cursor-pointer ${idx !== recentQuotations.length - 1 ? 'border-b border-white/[0.02]' : ''}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:border-blue-500/50 group-hover:text-blue-400 transition-all">
                      {q.namaKlien?.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{q.namaKlien}</h4>
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{q.nomorSurat}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-black text-blue-500">{fmtCompact(q.totalHarga)}</span>
                    {q.isInvoiced ? (
                      <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                        <CheckCircle className="w-2.5 h-2.5" /> Terbit
                      </span>
                    ) : (
                      <button 
                        onClick={() => handleConvertToInvoice(q.id, q.namaKlien)}
                        className="text-[8px] font-black text-slate-500 hover:text-blue-400 uppercase tracking-widest transition-colors"
                      >
                        Terbitkan →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              onClick={() => router.push("/quotations")}
              className="mt-6 w-full py-4 bg-slate-950/50 hover:bg-blue-600 hover:text-white text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/5"
            >
              Lihat Semua Penawaran
            </button>
          </div>

          {/* Recent Invoices Container */}
          <div className="bg-slate-900/40 border border-white/5 rounded-[40px] p-8 shadow-2xl backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-600/10 rounded-2xl flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white uppercase italic">Invoice</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Penagihan Terkini</p>
                </div>
              </div>
              <button onClick={() => router.push("/invoice")} className="p-2 hover:bg-white/5 rounded-full transition-colors group">
                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400" />
              </button>
            </div>

            <div className="flex-1 space-y-1">
              {recentInvoices.length === 0 ? (
                <div className="py-20 text-center text-slate-600 font-medium italic">Belum ada invoice terkini.</div>
              ) : recentInvoices.map((inv, idx) => (
                <div 
                  key={inv.id} 
                  onClick={() => router.push(`/invoice/edit/${inv.id}`)}
                  className={`flex items-center justify-between p-4 hover:bg-white/[0.03] rounded-2xl transition-all group cursor-pointer ${idx !== recentInvoices.length - 1 ? 'border-b border-white/[0.02]' : ''}`}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-full bg-slate-950 border border-white/5 flex items-center justify-center text-[10px] font-black ${inv.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'} group-hover:border-emerald-500/50 transition-all`}>
                      {inv.status === 'PAID' ? 'L' : 'P'}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-200 truncate group-hover:text-white transition-colors">{inv.clientName}</h4>
                      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{inv.invoiceNumber}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-black text-white">{fmtCompact(inv.total)}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1 h-1 rounded-full ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className={`text-[8px] font-black uppercase tracking-widest ${inv.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {inv.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={() => router.push("/invoice")}
              className="mt-6 w-full py-4 bg-slate-950/50 hover:bg-emerald-600 hover:text-white text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all border border-white/5"
            >
              Lihat Semua Invoice
            </button>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600">
        <p className="text-[10px] font-black uppercase tracking-widest">© 2026 PT. Apindo Karya Lestari — Studio Suite v2.5</p>
        <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest">
          <button className="hover:text-blue-500 transition-colors">Dokumentasi</button>
          <button className="hover:text-blue-500 transition-colors">Bantuan</button>
        </div>
      </footer>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Sub-components for better organization
function StatCard({ title, value, icon, color }: { title: string, value: any, icon: any, color: 'blue' | 'emerald' | 'indigo' | 'amber' }) {
  const colors = {
    blue: 'bg-blue-600/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20',
    indigo: 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20',
    amber: 'bg-amber-600/10 text-amber-400 border-amber-500/20',
  };

  return (
    <div className={`p-6 rounded-[32px] border ${colors[color]} backdrop-blur-sm shadow-xl transition-all hover:scale-[1.02] duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{title}</div>
        <div className="opacity-40">{icon}</div>
      </div>
      <div className="text-3xl font-black tracking-tighter text-white">{value}</div>
    </div>
  );
}

function ServiceCard({ title, subtitle, icon, color, onClick, isPlaceholder, stats }: { 
  title: string, subtitle: string, icon: any, color: 'blue' | 'emerald' | 'indigo' | 'amber', 
  onClick?: () => void, isPlaceholder?: boolean, stats?: string 
}) {
  const colors = {
    blue: 'from-blue-600 to-blue-800 shadow-blue-900/40 hover:shadow-blue-500/20',
    emerald: 'from-emerald-600 to-emerald-800 shadow-emerald-900/40 hover:shadow-emerald-500/20',
    indigo: 'from-indigo-600 to-indigo-800 shadow-indigo-900/40 hover:shadow-indigo-500/20',
    amber: 'from-amber-600 to-amber-800 shadow-amber-900/40 hover:shadow-amber-500/20',
  };

  return (
    <button 
      onClick={onClick}
      disabled={isPlaceholder}
      className={`relative group flex flex-col p-8 rounded-[32px] bg-gradient-to-br ${colors[color]} shadow-2xl transition-all duration-500 hover:translate-y-[-4px] ${isPlaceholder ? 'opacity-50 cursor-not-allowed filter grayscale-[0.3]' : 'active:scale-95'}`}
    >
      <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-24 h-24' })}
      </div>
      
      <div className="relative z-10">
        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 shadow-inner">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-7 h-7 text-white' })}
        </div>
        <h3 className="text-xl font-black text-white mb-1 tracking-tight uppercase">{title}</h3>
        <p className="text-xs text-white/60 font-medium mb-6 uppercase tracking-wider">{subtitle}</p>
        
        {stats && (
          <div className="mt-auto flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{stats}</span>
          </div>
        )}
      </div>
    </button>
  );
}

function NavButton({ icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-950 border border-white/5 rounded-2xl hover:bg-slate-800 hover:border-blue-500/30 transition-all group"
    >
      <div className="text-slate-500 group-hover:text-blue-400 transition-colors scale-75 md:scale-100">
        {React.cloneElement(icon, { className: 'w-4 h-4' })}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}
