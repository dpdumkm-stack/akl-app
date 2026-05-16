import React from "react";
import { InvoiceData, InvoiceItemData } from "@/lib/types";
import { Trash2, GripVertical, Search } from "lucide-react";

interface InvoiceItemRowProps {
  item: InvoiceItemData;
  data: InvoiceData;
  onUpdate: (id: string, field: string, value: any) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onDelete: (id: string) => void;
  onOpenMaster: (id: string) => void;
}

export default function InvoiceItemRow({ item, data, onUpdate, onMove, onDelete, onOpenMaster }: InvoiceItemRowProps) {
  return (
    <div className="group relative bg-slate-950/50 hover:bg-slate-900 border border-white/5 hover:border-blue-500/30 rounded-3xl p-4 sm:p-5 transition-all shadow-sm">
      
      {/* Control Actions (Top Right) */}
      <div className="absolute -top-3 right-4 flex items-center bg-slate-900 border border-white/10 rounded-full px-2 py-1 shadow-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
        <button type="button" onClick={() => onMove(item.id, 'up')} className="p-1.5 text-slate-400 hover:text-white transition-colors" title="Geser ke Atas">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-3 bg-white/10 mx-1"></div>
        <button type="button" onClick={() => onDelete(item.id)} className="p-1.5 text-red-400 hover:text-red-300 transition-colors" title="Hapus Baris">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4 items-start">
        {/* Uraian Pekerjaan (Full width on mobile, 5 cols on desktop) */}
        <div className="col-span-12 md:col-span-5 space-y-2">
          <div className="flex justify-between items-center mb-1">
            <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">Uraian Pekerjaan & Bahan</label>
            <button 
                type="button" 
                onClick={() => onOpenMaster(item.id)}
                className="text-[9px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
                <Search className="w-3 h-3" /> Master
            </button>
          </div>
          <textarea 
            rows={2}
            value={item.description} 
            onChange={e => onUpdate(item.id, 'description', e.target.value)} 
            placeholder="Ketik uraian..." 
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs outline-none focus:border-blue-500/50 transition-all custom-scrollbar resize-none" 
          />
        </div>

        {/* Volume (Half on mobile, 2 cols on desktop) */}
        <div className="col-span-6 md:col-span-2 space-y-2">
          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest sm:text-center block mb-1">Vol (Ops)</label>
          <input 
            type="number" 
            min="0"
            step="any"
            value={item.volume !== null && item.volume !== undefined ? item.volume : ''} 
            onChange={e => onUpdate(item.id, 'volume', e.target.value)} 
            placeholder="Kosong=1"
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs sm:text-center outline-none focus:border-blue-500/50 transition-all" 
          />
        </div>

        {/* Satuan (Half on mobile, 2 cols on desktop) */}
        <div className="col-span-6 md:col-span-2 space-y-2">
          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest sm:text-center block mb-1">Satuan</label>
          <input 
            type="text" 
            value={item.satuan || ''} 
            onChange={e => onUpdate(item.id, 'satuan', e.target.value)} 
            placeholder="m2, ls" 
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs sm:text-center outline-none focus:border-blue-500/50 transition-all" 
          />
        </div>

        {/* Harga Satuan (Full on mobile, 3 cols on desktop) */}
        <div className="col-span-12 md:col-span-3 space-y-2">
          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest sm:text-right block mb-1">Harga/Sat (Rp)</label>
          <input 
            type="number" 
            min="0" 
            value={item.unitPrice || ''} 
            onChange={e => onUpdate(item.id, 'unitPrice', Number(e.target.value))} 
            className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-2.5 text-white font-bold text-xs sm:text-right outline-none focus:border-blue-500/50 transition-all" 
          />
        </div>
      </div>
    </div>
  );
}
