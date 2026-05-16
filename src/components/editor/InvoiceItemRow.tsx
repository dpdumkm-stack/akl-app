"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';
import { InvoiceItemData } from '@/lib/types';
import TextEditorTrigger from '@/components/TextEditorTrigger';

interface InvoiceItemRowProps {
  index: number;
  item: InvoiceItemData;
  onChange: (field: keyof InvoiceItemData, value: any) => void;
  onRemove: () => void;
}

export default function InvoiceItemRow({ index, item, onChange, onRemove }: InvoiceItemRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 mb-3 group relative">
      <div className="md:col-span-7">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Deskripsi Pekerjaan</label>
        <TextEditorTrigger
          value={item.description}
          onChange={(val) => onChange('description', val)}
          title="Deskripsi Pekerjaan"
          placeholder="Contoh: Epoxy Flooring 1000 Micron..."
          accentColor="blue"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qty</label>
        <input
          type="number"
          value={item.quantity}
          onChange={e => onChange('quantity', Number(e.target.value))}
          className="w-full bg-white border border-slate-200 rounded-lg p-3 sm:p-2 text-base sm:text-sm outline-none focus:border-blue-500 transition-all text-center"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Harga Satuan</label>
        <input
          type="number"
          value={item.unitPrice}
          onChange={e => onChange('unitPrice', Number(e.target.value))}
          className="w-full bg-white border border-slate-200 rounded-lg p-3 sm:p-2 text-base sm:text-sm outline-none focus:border-blue-500 transition-all text-right"
        />
      </div>
      <div className="md:col-span-1 flex items-end justify-center pb-1">
        <button
          type="button"
          onClick={onRemove}
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 active:scale-95 rounded-xl transition-all"
          title="Hapus Item"
        >
          <Trash2 className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
