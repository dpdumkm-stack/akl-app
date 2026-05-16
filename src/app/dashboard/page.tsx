"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  FileText, Receipt, Plus, ArrowRight, Clock, CheckCircle,
  TrendingUp, Users, Settings, Download, 
  BarChart3, PieChart, DollarSign, Wallet
} from "lucide-react";
import { convertToInvoice } from "@/app/actions";
import { getFinancialStats } from "@/app/actions/finance";

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

interface FinancialStats {
  quotationMonth: { total: number; count: number };
  invoiceMonth: { total: number; count: number };
  paid: number;
  pending: number;
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
  const { data: session } = useSession();
  const router = useRouter();
  
  const [finStats, setFinStats] = useState<FinancialStats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentQuotations, setRecentQuotations] = useState<QuotationSummary[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, qRes, iRes] = await Promise.all([
        getFinancialStats(),
        fetch("/api/quotations/list").then(r => r.json()),
        fetch("/api/invoice/list").then(r => r.json()),
      ]);

      if (fRes.success) {
        setFinStats(fRes.stats);
        setChartData(fRes.chartData);
      }

      setRecentQuotations((qRes.quotations ?? []).slice(0, 5));
      setRecentInvoices((iRes.invoices ?? []).slice(0, 5));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleExport = () => {
    window.open("/api/export/invoices", "_blank");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 px-4 py-6 sm:p-0">
      {/* Header & Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-white uppercase italic">
            Dashboard <span className="text-blue-500">Finansial</span>
          </h2>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em]">Ringkasan Bisnis Studio AKL</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-3 px-6 py-3 bg-slate-900 border border-white/5 text-slate-300 rounded-2xl shadow-sm hover:shadow-md hover:bg-slate-800 transition-all font-black text-[10px] uppercase tracking-widest"
        >
          <Download className="w-4 h-4 text-blue-400" /> Export Laporan Excel
        </button>
      </div>

      {/* Financial Overview Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Omzet Bulan Ini" 
          value={fmtCompact(finStats?.invoiceMonth.total || 0)} 
          subValue={`${finStats?.invoiceMonth.count || 0} Invoice`}
          icon={<DollarSign className="w-5 h-5" />} 
          color="blue" 
        />
        <StatCard 
          title="Sudah Dibayar" 
          value={fmtCompact(finStats?.paid || 0)} 
          subValue="Total Cair"
          icon={<CheckCircle className="w-5 h-5" />} 
          color="emerald" 
        />
        <StatCard 
          title="Piutang (Pending)" 
          value={fmtCompact(finStats?.pending || 0)} 
          subValue="Belum Dibayar"
          icon={<Clock className="w-5 h-5" />} 
          color="amber" 
        />
        <StatCard 
          title="Nilai Penawaran" 
          value={fmtCompact(finStats?.quotationMonth.total || 0)} 
          subValue={`${finStats?.quotationMonth.count || 0} Draft PH`}
          icon={<FileText className="w-5 h-5" />} 
          color="indigo" 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-white/5 rounded-[32px] p-8 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase">Tren Pendapatan</h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">6 Bulan Terakhir</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex items-end justify-between gap-4 min-h-[200px] pt-4">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div className="relative w-full flex items-end justify-center">
                  <div 
                    className="w-full max-w-[40px] bg-blue-600 rounded-t-xl transition-all duration-1000 group-hover:bg-blue-500 shadow-lg shadow-blue-900/10"
                    style={{ height: `${Math.max(10, (d.total / (Math.max(...chartData.map(x => x.total)) || 1)) * 100)}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                      {fmtCompact(d.total)}
                    </div>
                  </div>
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Center */}
        <div className="bg-slate-900 rounded-[32px] p-8 shadow-2xl flex flex-col justify-between overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none transform rotate-12 group-hover:scale-110 transition-transform duration-1000">
             <Wallet className="w-48 h-48 text-white" />
           </div>
           
           <div className="relative z-10">
             <h3 className="text-lg font-black text-white uppercase italic mb-2">Pusat Kendali</h3>
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8">Quick Actions Admin</p>
             
             <div className="space-y-3">
               <ActionButton 
                 icon={<Plus className="w-4 h-4" />} 
                 label="Buat Penawaran" 
                 onClick={() => router.push("/quotations/create")} 
                 color="blue"
               />
               <ActionButton 
                 icon={<Receipt className="w-4 h-4" />} 
                 label="Tulis Invoice" 
                 onClick={() => {
                   if ((session?.user as any)?.role !== "OWNER") {
                     alert("Mohon maaf, fitur Invoice sedang dalam tahap penyempurnaan oleh tim IT. Silakan gunakan fitur Penawaran untuk saat ini.");
                   } else {
                     router.push("/invoice/create");
                   }
                 }} 
                 color="emerald"
                 isDev={(session?.user as any)?.role !== "OWNER"}
               />
               <ActionButton 
                 icon={<Users className="w-4 h-4" />} 
                 label="Data Klien" 
                 onClick={() => router.push("/clients")} 
                 color="slate"
               />
             </div>
           </div>

           <div className="mt-12 pt-6 border-t border-white/5 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400 text-[10px] font-black">
                  {session?.user?.name?.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase">{session?.user?.name}</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Sesi Aktif Sekarang</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentTable 
          title="Penawaran Terbaru" 
          items={recentQuotations} 
          type="PH" 
          onClick={(id: string) => router.push(`/quotations/edit/${id}`)} 
        />
        <RecentTable 
          title="Invoice Terkini" 
          items={recentInvoices} 
          type="INV" 
          onClick={(id: string) => {
            if ((session?.user as any)?.role !== "OWNER") {
              alert("Mohon maaf, fitur Invoice sedang dalam tahap penyempurnaan oleh tim IT. Silakan gunakan fitur Penawaran untuk saat ini.");
            } else {
              router.push(`/invoice/edit/${id}`);
            }
          }} 
          isDev={(session?.user as any)?.role !== "OWNER"}
        />
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon, color }: any) {
  const colors: any = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  };
  return (
    <div className={`p-6 rounded-[32px] bg-slate-900 border border-white/5 shadow-sm transition-all hover:shadow-md group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</div>
        <div className={`p-2 rounded-xl transition-all group-hover:scale-110 ${colors[color]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-black text-white tracking-tighter">{value}</div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{subValue}</div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, color, isDev }: any) {
  const colors: any = {
    blue: "bg-blue-600 hover:bg-blue-500 shadow-blue-900/40",
    emerald: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40",
    slate: "bg-slate-800 hover:bg-slate-700 shadow-slate-950/40",
  };
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-white transition-all shadow-lg font-black text-[10px] uppercase tracking-widest active:scale-95 ${colors[color]} ${isDev ? 'opacity-70 grayscale' : ''}`}
    >
      {icon} {label}
      {isDev && <span className="ml-auto text-[8px] bg-black/40 text-white/70 px-2 py-0.5 rounded">DEV</span>}
    </button>
  );
}

function RecentTable({ title, items, type, onClick, isDev }: any) {
  return (
    <div className={`bg-slate-900 border border-white/5 rounded-[32px] p-8 shadow-sm ${isDev ? 'opacity-80' : ''}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-white uppercase italic">{title}</h3>
          {isDev && <span className="text-[8px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-black tracking-widest uppercase">DEV</span>}
        </div>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{items.length} Data</span>
      </div>
      <div className="space-y-1">
        {items.map((item: any) => (
          <div 
            key={item.id} 
            onClick={() => onClick(item.id)}
            className="flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all cursor-pointer group"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-black text-slate-200 uppercase truncate">{item.clientName || item.namaKlien}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.invoiceNumber || item.nomorSurat}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-black text-blue-400">{fmtCompact(item.total || item.totalHarga)}</p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                {new Date(item.date || item.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-12 text-center text-[10px] font-bold text-slate-400 uppercase italic">Tidak ada data terbaru</div>
        )}
      </div>
    </div>
  );
}
