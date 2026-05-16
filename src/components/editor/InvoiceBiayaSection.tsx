import React from "react";
import { InvoiceData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface InvoiceBiayaSectionProps {
  data: InvoiceData;
  setData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  subTotal: number;
  total: number;
}

export default function InvoiceBiayaSection({ data, setData, subTotal, total }: InvoiceBiayaSectionProps) {
  const dpp = subTotal - Number(data.discountAmount || 0);
  const tax = data.taxApplied ? dpp * 0.11 : 0;
  const isDPMode = data.invoiceType === 'DP';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 sm:p-8 shadow-2xl">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4 mb-6">
          Kalkulasi Tagihan
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Kiri: Pengaturan Kalkulasi */}
          <div className="space-y-6">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Diskon Global (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                <input 
                  type="number" 
                  min="0"
                  value={data.discountAmount || ''} 
                  onChange={(e) => setData(prev => ({ ...prev, discountAmount: Number(e.target.value) }))} 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-red-400 font-bold text-sm outline-none focus:border-red-500/50 transition-all" 
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 border border-white/10 rounded-xl">
              <div>
                <p className="text-sm font-black text-white">Kenakan PPN 11%</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-1">
                  PPN dihitung dari DPP
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setData(prev => ({ ...prev, taxApplied: !prev.taxApplied }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${data.taxApplied ? 'bg-blue-600' : 'bg-slate-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${data.taxApplied ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">
                Retensi (%) - Opsional
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  min="0"
                  max="100"
                  value={data.retentionPercent || ''} 
                  onChange={(e) => setData(prev => ({ ...prev, retentionPercent: Number(e.target.value) }))} 
                  placeholder="0"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl pr-10 pl-4 py-3 text-emerald-400 font-bold text-sm outline-none focus:border-emerald-500/50 transition-all" 
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">
                  Uang Muka / DP Sudah Dibayar
                </label>
                {data.invoiceType === 'DP' && (
                  <button 
                    type="button"
                    onClick={() => {
                      const calcDP = (subTotal - Number(data.discountAmount || 0) + (data.taxApplied ? (subTotal - Number(data.discountAmount || 0)) * 0.11 : 0)) * 0.3;
                      setData(prev => ({ ...prev, downPaymentPercent: 30, downPayment: calcDP }));
                    }}
                    className="text-[9px] font-black bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded hover:bg-blue-600 hover:text-white transition-colors"
                  >
                    SET 30%
                  </button>
                )}
              </div>
              
              <div className="flex gap-3">
                <div className="relative w-28 shrink-0">
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={data.downPaymentPercent || ''} 
                    onChange={(e) => {
                      const pct = Number(e.target.value);
                      const currentGrandTotal = subTotal - Number(data.discountAmount || 0) + (data.taxApplied ? (subTotal - Number(data.discountAmount || 0)) * 0.11 : 0);
                      setData(prev => ({ ...prev, downPaymentPercent: pct, downPayment: pct > 0 ? currentGrandTotal * (pct / 100) : 0 }));
                    }} 
                    placeholder="0"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pr-8 pl-3 py-3 text-amber-400 font-bold text-sm outline-none focus:border-amber-500/50 transition-all" 
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                </div>

                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                  <input 
                    type="number" 
                    min="0"
                    value={data.downPayment || ''} 
                    onChange={(e) => {
                      // If user manually changes nominal, clear the percentage to avoid confusion
                      setData(prev => ({ ...prev, downPayment: Number(e.target.value), downPaymentPercent: 0 }));
                    }} 
                    className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-amber-400 font-bold text-sm outline-none focus:border-amber-500/50 transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Kanan: Ringkasan Total */}
          <div className="bg-slate-950 border border-white/5 rounded-2xl p-5 sm:p-6 flex flex-col justify-center space-y-4">
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-xs font-bold uppercase tracking-widest">Subtotal</span>
              <span className="font-bold">{formatCurrency(subTotal)}</span>
            </div>
            
            {Number(data.discountAmount || 0) > 0 && (
              <div className="flex justify-between items-center text-red-400">
                <span className="text-xs font-bold uppercase tracking-widest">Diskon</span>
                <span className="font-bold">-{formatCurrency(Number(data.discountAmount))}</span>
              </div>
            )}

            {data.taxApplied && (
              <>
                <div className="flex justify-between items-center text-slate-300">
                  <span className="text-xs font-bold uppercase tracking-widest">DPP</span>
                  <span className="font-bold">{formatCurrency(dpp)}</span>
                </div>
                <div className="flex justify-between items-center text-blue-400">
                  <span className="text-xs font-bold uppercase tracking-widest">PPN 11%</span>
                  <span className="font-bold">{formatCurrency(tax)}</span>
                </div>
              </>
            )}

            {Number(data.downPayment || 0) > 0 && !isDPMode && (
              <div className="flex justify-between items-center text-amber-400 pt-2 border-t border-white/5">
                <span className="text-xs font-bold uppercase tracking-widest">DP Dibayar</span>
                <span className="font-bold">-{formatCurrency(Number(data.downPayment))}</span>
              </div>
            )}

            {Number(data.retentionPercent || 0) > 0 && data.invoiceType !== 'RETENSI' && (
              <div className="flex justify-between items-center text-emerald-400 pt-1">
                <span className="text-xs font-bold uppercase tracking-widest">Potongan Retensi ({data.retentionPercent}%)</span>
                <span className="font-bold">-{formatCurrency((dpp + tax) * (Number(data.retentionPercent) / 100))}</span>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 mt-2">
              <div className="flex justify-between items-end">
                <span className="text-xs font-black text-white uppercase tracking-widest">
                  {isDPMode ? 'TOTAL TAGIHAN DP' : data.invoiceType === 'RETENSI' ? 'TOTAL TAGIHAN RETENSI' : (Number(data.downPayment || 0) > 0 || Number(data.retentionPercent || 0) > 0 ? 'SISA TAGIHAN' : 'GRAND TOTAL')}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
