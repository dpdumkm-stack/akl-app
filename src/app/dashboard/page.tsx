"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FileText, Receipt, Plus, ArrowRight, Clock, CheckCircle,
  AlertCircle, TrendingUp, Users, LogOut, Settings,
  ChevronRight, Layers, Bell
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

const statusConfig = {
  PENDING: { label: "Pending", cls: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
  PAID: { label: "Lunas", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  CANCELLED: { label: "Batal", cls: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400" },
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
      const [qRes, iRes] = await Promise.all([
        fetch("/api/quotations/list").then(r => r.json()).catch(() => ({ success: false })),
        fetch("/api/invoice/list").then(r => r.json()).catch(() => ({ success: false })),
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

      setRecentQuotations(quotations.slice(0, 4));
      setRecentInvoices(invoices.slice(0, 4));
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
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/8 blur-[120px] rounded-full" />
        <div className="absolute top-[40%] right-[20%] w-[25%] h-[25%] bg-emerald-600/6 blur-[100px] rounded-full" />
      </div>

      {/* Top Nav */}
      <nav className="relative z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-gray-900 font-black text-lg tracking-tight">STUDIO AKL</span>
                <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] leading-none">Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="relative p-2.5 rounded-xl bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="w-4 h-4" />
                {stats.pendingInvoices > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center">
                    {stats.pendingInvoices}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2.5 bg-gray-200 rounded-xl px-3 py-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-red-500 rounded-lg flex items-center justify-center text-[10px] font-black">
                  {session?.user?.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <span className="text-gray-800 text-xs font-bold hidden md:block">{session?.user?.name ?? "Admin"}</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="p-2.5 rounded-xl bg-gray-200 text-gray-600 hover:text-red-400 hover:bg-red-100 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </nav>

      <div className="relative z-[60] max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">
              Selamat datang, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-red-600">{session?.user?.name ?? "Admin"}</span> 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm">PT. Apindo Karya Lestari — Sistem Manajemen Penawaran &amp; Invoice</p>
          </div>
          
          <button 
            onClick={() => window.alert("SISTEM KLIK AKTIF!")}
            className="px-4 py-2 bg-red-600 text-white font-black rounded-xl shadow-lg z-[100]"
          >
            TEST KLIK SISTEM
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-2xl">
             <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conversion Rate</span>
                <span className="text-sm font-black text-fuchsia-400">{stats.conversionRate}%</span>
             </div>
             <div className="w-10 h-10 bg-fuchsia-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-fuchsia-400" />
             </div>
          </div>
        </div>

        {/* Lifecycle Visualization */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <Layers className="w-48 h-48 text-white" />
            </div>
            
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-10 text-center md:text-left">Alur Kerja Dokumen (Lifecycle)</h3>
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 md:gap-4 max-w-4xl mx-auto">
                {/* Connector Line */}
                <div className="hidden md:block absolute top-[32px] left-0 w-full h-[2px] bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-emerald-500/20 z-0"></div>
                
                {[
                    { label: "Penawaran", value: stats.totalQuotations, sub: "Diterbitkan", icon: FileText, color: "from-violet-500 to-violet-600", shadow: "shadow-violet-900/40" },
                    { label: "Invoice", value: stats.invoicedQuotations, sub: "Terintegrasi", icon: Receipt, color: "from-blue-500 to-blue-600", shadow: "shadow-blue-900/40" },
                    { label: "Pembayaran", value: stats.paidInvoices, sub: "Dana Masuk", icon: CheckCircle, color: "from-emerald-500 to-emerald-600", shadow: "shadow-emerald-900/40" },
                ].map((step, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                        <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center shadow-xl ${step.shadow} mb-4 group-hover:scale-110 transition-transform duration-500`}>
                            <step.icon className="w-8 h-8 text-white" />
                        </div>
                        <p className="text-white font-black text-2xl tracking-tighter">{step.value}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{step.label}</p>
                        <p className="text-[9px] font-bold text-slate-600 uppercase mt-0.5">{step.sub}</p>
                    </div>
                ))}
            </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Penawaran", value: stats.totalQuotations, icon: FileText, color: "from-violet-600 to-violet-700", glow: "shadow-violet-900/40" },
            { label: "Total Invoice", value: stats.totalInvoices, icon: Receipt, color: "from-blue-600 to-blue-700", glow: "shadow-blue-900/40" },
            { label: "Invoice Pending", value: stats.pendingInvoices, icon: Clock, color: "from-amber-500 to-orange-600", glow: "shadow-amber-900/40" },
            { label: "Invoice Lunas", value: stats.paidInvoices, icon: CheckCircle, color: "from-emerald-500 to-emerald-600", glow: "shadow-emerald-900/40" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-slate-700 transition-all">
                <div className={`w-11 h-11 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg ${stat.glow} flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Revenue Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-700/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Total Pendapatan Terbayar</p>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-300">{fmtCompact(stats.totalRevenue)}</p>
            <p className="text-xs text-emerald-600 mt-1">{stats.paidInvoices} invoice lunas</p>
          </div>
          <div className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border border-amber-700/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-amber-400 uppercase tracking-widest">Outstanding / Belum Dibayar</p>
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-3xl font-black text-amber-300">{fmtCompact(stats.outstandingBalance)}</p>
            <p className="text-xs text-amber-600 mt-1">{stats.pendingInvoices} invoice pending</p>
          </div>
        </div>

        {/* Main Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Penawaran Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col hover:border-violet-700/50 transition-all group">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-violet-900/50">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">PENAWARAN</h2>
                <p className="text-xs text-slate-500 font-medium">Quotation Generator</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Total Aktif", value: stats.totalQuotations },
                { label: "Bulan Ini", value: recentQuotations.filter(q => new Date(q.createdAt).getMonth() === new Date().getMonth()).length },
                { label: "Template", value: 3 },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-violet-400">{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-violet-900/30 flex items-center justify-center gap-2 mb-5"
            >
              <Plus className="w-4 h-4" /> Buat Penawaran Baru
            </button>

            {/* Recent quotations */}
            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Penawaran Terbaru</p>
              {recentQuotations.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-4">Belum ada penawaran</p>
              ) : recentQuotations.map(q => (
                <div key={q.id} className="flex items-center justify-between py-2.5 px-3 bg-slate-200 border border-slate-300 rounded-xl group relative">
                  <div className="min-w-0">
                    <p className="text-slate-900 font-bold text-xs truncate">{q.namaKlien}</p>
                    <p className="text-slate-500 text-[10px]">{q.nomorSurat}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-blue-600 text-xs font-black">{fmtCompact(q.totalHarga)}</span>
                      {q.isInvoiced ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[9px] font-black uppercase tracking-tighter">Terbit</span>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => handleConvertToInvoice(q.id, q.namaKlien)}
                          className="relative z-[200] p-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl transition-all shadow-md active:scale-90"
                          title="Terbitkan Invoice"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => router.push("/")} className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-violet-400 transition-colors font-semibold">
              Lihat semua penawaran <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Invoice Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col hover:border-emerald-700/50 transition-all group">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-900/50">
                <Receipt className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">INVOICE</h2>
                <p className="text-xs text-slate-500 font-medium">Invoice Generator</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: "Total Invoice", value: stats.totalInvoices },
                { label: "Pending", value: stats.pendingInvoices },
                { label: "Lunas", value: stats.paidInvoices },
              ].map(s => (
                <div key={s.label} className="bg-slate-800/60 rounded-xl p-3 text-center">
                  <p className="text-xl font-black text-emerald-400">{s.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push("/invoice")}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 mb-5"
            >
              <Plus className="w-4 h-4" /> Buat Invoice Baru
            </button>

            {/* Recent invoices */}
            <div className="flex-1 space-y-2">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">Invoice Terbaru</p>
              {recentInvoices.length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-4">Belum ada invoice</p>
              ) : recentInvoices.map(inv => {
                const sc = statusConfig[inv.status];
                return (
                  <div key={inv.id} className="flex items-center justify-between py-2.5 px-3 bg-slate-800/40 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer" onClick={() => router.push("/invoice")}>
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-xs truncate">{inv.clientName}</p>
                      <p className="text-slate-500 text-[10px]">{inv.invoiceNumber}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${sc.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                        {sc.label}
                      </span>
                      <ChevronRight className="w-3 h-3 text-slate-600" />
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => router.push("/invoice")} className="mt-4 flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-emerald-400 transition-colors font-semibold">
              Lihat semua invoice <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Log Diagnostik Persistent */}
        <div className="mt-12 bg-black border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <div className="w-3 h-3 bg-amber-500 rounded-full" />
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span className="ml-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">System Diagnostic Log</span>
            </div>
            <div className="font-mono text-xs space-y-2">
                <p className="text-emerald-500">[SYSTEM] Dashboard initialized.</p>
                {systemError ? (
                    <p className="text-red-400 animate-pulse font-bold">{systemError}</p>
                ) : (
                    <p className="text-slate-600">Menunggu aksi pengguna...</p>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <p className="text-xs text-slate-700 font-medium">© 2026 PT. Apindo Karya Lestari — Studio AKL v2.0</p>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-900 border-red-800 text-red-200' : 'bg-emerald-900 border-emerald-800 text-emerald-200'}`}>
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            <p className="text-sm font-bold">{toast.msg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
