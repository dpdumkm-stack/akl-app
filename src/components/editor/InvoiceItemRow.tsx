"use client";

import React from 'react';
import { Trash2 } from 'lucide-react';
import { InvoiceItemData } from '@/lib/types';

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
        <textarea
          value={item.description}
          onChange={e => onChange('description', e.target.value)}
          rows={1}
          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-all"
          placeholder="Contoh: Epoxy Flooring 1000 Micron..."
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Qty</label>
        <input
          type="number"
          value={item.quantity}
          onChange={e => onChange('quantity', Number(e.target.value))}
          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-all text-center"
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Harga Satuan</label>
        <input
          type="number"
          value={item.unitPrice}
          onChange={e => onChange('unitPrice', Number(e.target.value))}
          className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-blue-500 transition-all text-right"
        />
      </div>
      <div className="md:col-span-1 flex items-end justify-center pb-1">
        <button
          type="button"
          onClick={onRemove}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Hapus Item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
