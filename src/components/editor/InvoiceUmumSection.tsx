import React from "react";
import { InvoiceData } from "@/lib/types";

interface InvoiceUmumSectionProps {
  data: InvoiceData;
  setData: React.Dispatch<React.SetStateAction<InvoiceData>>;
  nomorUrut: number;
  setNomorUrut: (n: number) => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function InvoiceUmumSection({ data, setData, nomorUrut, setNomorUrut, showToast }: InvoiceUmumSectionProps) {
  // Update both date and dueDate automatically
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateStr = e.target.value;
    if (!newDateStr) return;

    const selectedDate = new Date(newDateStr);
    
    // Calculate 7 days ahead
    const dueDate = new Date(selectedDate);
    dueDate.setDate(dueDate.getDate() + 7);
    
    // Format to YYYY-MM-DD
    const newDueDateStr = dueDate.toISOString().split('T')[0];

    setData(prev => ({
      ...prev,
      date: newDateStr,
      dueDate: newDueDateStr
    }));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-slate-900 border border-white/5 rounded-3xl p-5 sm:p-8 space-y-6 shadow-2xl">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-4">
          Informasi Invoice
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">No. Urut (Internal)</label>
              <input 
                type="number" 
                value={nomorUrut || ''} 
                onChange={(e) => setNomorUrut(Number(e.target.value))} 
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all" 
              />
              <p className="text-[9px] text-slate-500 mt-1 uppercase tracking-widest font-black">Digunakan untuk auto-generate No Surat</p>
            </div>

            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nomor Invoice Manual (Opsional)</label>
              <input 
                type="text" 
                value={data.invoiceNumber || ''} 
                onChange={(e) => setData(prev => ({ ...prev, invoiceNumber: e.target.value }))} 
                placeholder="Kosongkan jika auto-generate" 
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Jenis Tagihan</label>
              <select 
                value={data.invoiceType} 
                onChange={(e) => setData(prev => ({ ...prev, invoiceType: e.target.value as 'DP' | 'PELUNASAN' }))} 
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
              >
                <option value="PELUNASAN">FULL PAYMENT / PELUNASAN</option>
                <option value="DP">UANG MUKA (DP)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Tgl Terbit</label>
                <input 
                  type="date" 
                  value={data.date?.split('T')[0] || ''} 
                  onChange={handleDateChange} 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs sm:text-sm outline-none focus:border-blue-500/50 transition-all" 
                />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Jatuh Tempo</label>
                <input 
                  type="date" 
                  value={data.dueDate?.split('T')[0] || ''} 
                  onChange={(e) => setData(prev => ({ ...prev, dueDate: e.target.value }))} 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-xs sm:text-sm outline-none focus:border-blue-500/50 transition-all" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
           <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 block">Informasi Klien</h4>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Nama Perusahaan (Client)</label>
                  <input 
                    type="text" 
                    value={data.companyName || ''} 
                    onChange={(e) => setData(prev => ({ ...prev, companyName: e.target.value }))} 
                    placeholder="PT. ABC Nusantara" 
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all" 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">U.P (Contact Person) - Opsional</label>
                  <input 
                    type="text" 
                    value={data.clientName || ''} 
                    onChange={(e) => setData(prev => ({ ...prev, clientName: e.target.value }))} 
                    placeholder="Bpk. John Doe" 
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all" 
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Alamat Penagihan</label>
                <textarea 
                  rows={4}
                  value={data.clientAddress || ''} 
                  onChange={(e) => setData(prev => ({ ...prev, clientAddress: e.target.value }))} 
                  placeholder="Ketik alamat lengkap..." 
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-white font-bold text-sm outline-none focus:border-blue-500/50 transition-all resize-none" 
                />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
