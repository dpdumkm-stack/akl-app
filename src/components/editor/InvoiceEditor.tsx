import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { InvoiceData, InvoiceItemData } from '@/lib/types';
import { getNextInvoiceNumber } from '@/lib/invoice-number-service';
import InvoiceItemRow from '@/components/editor/InvoiceItemRow';
import { saveInvoice } from '@/app/actions';
import { Save } from 'lucide-react';

export default function InvoiceEditor({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession();
  const isAdmin = !!(session?.user as any)?.role?.includes('admin');

  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [nomorUrut, setNomorUrut] = useState<number>(0);
  const [date, setDate] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [taxApplied, setTaxApplied] = useState<boolean>(false);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<InvoiceItemData[]>([]);

  // Generate invoice number on mount
  useEffect(() => {
    (async () => {
      const res = await getNextInvoiceNumber();
      if (res) {
        setInvoiceNumber(res.invoiceNumber);
        setNomorUrut(res.nextUrut);
      }
    })();
  }, []);

  const handleAddItem = () => {
    setItems(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), description: '', quantity: 0, unitPrice: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemData, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      // @ts-ignore
      copy[index][field] = value;
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, it) => sum + Number(it.quantity) * Number(it.unitPrice), 0);
  };

  const handleSave = async () => {
    if (!isAdmin) {
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Hanya admin yang dapat menyimpan invoice', 'error');
      } else {
        alert('Hanya admin yang dapat menyimpan invoice');
      }
      return;
    }

    if (!clientName && !companyName) {
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Minimal isi salah satu antara Nama Perusahaan atau Nama Penerima (U.P.)', 'error');
      } else {
        alert('Minimal isi salah satu antara Nama Perusahaan atau Nama Penerima (U.P.)');
      }
      return;
    }
    const subtotal = calculateSubtotal();
    const taxAmount = taxApplied ? subtotal * 0.11 : 0;
    const total = subtotal + taxAmount - discountAmount - downPayment;
    const payload: InvoiceData = {
      id: '', // server will generate
      invoiceNumber,
      nomorUrut,
      date: date, // send as string
      dueDate: dueDate || null,
      clientName,
      companyName,
      clientAddress,
      items,
      subtotal,
      taxRate: 0.11,
      taxApplied,
      taxAmount,
      discountAmount,
      downPayment,
      notes,
      total,
      status: 'DRAFT',
    } as any;
    const res = await saveInvoice(payload);
    if (res.success) {
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Invoice berhasil disimpan', 'success');
      } else {
        alert('Invoice berhasil disimpan');
      }
      onClose?.();
    } else {
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast('Gagal menyimpan: ' + (res as any).message, 'error');
      } else {
        alert('Gagal menyimpan: ' + (res as any).message);
      }
    }
  };

  return (
    <div className="p-8 bg-slate-800/90 rounded-[40px] shadow-2xl border border-white/5 max-w-4xl mx-auto backdrop-blur-xl font-['Outfit',sans-serif]">
      <div className="flex items-center gap-3 border-b border-white/5 pb-6 mb-6">
          <div className="p-2 bg-slate-900 rounded-xl text-emerald-500 border border-white/5"><Save className="w-6 h-6"/></div>
          <h2 className="text-xl font-black uppercase tracking-widest text-white">Buat Invoice Baru</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nomor Invoice</label>
          <input type="text" readOnly value={invoiceNumber} className="w-full p-3 bg-slate-900/50 border-2 border-white/5 rounded-2xl text-sm font-black text-slate-400 outline-none" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Tanggal</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:border-blue-500 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Jatuh Tempo</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full p-3 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:border-blue-500 outline-none transition-all" />
        </div>
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nama Perusahaan</label>
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className="w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:border-blue-500 outline-none transition-all shadow-lg" placeholder="Opsional jika U.P. diisi" />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nama Penerima (U.P.)</label>
            <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:border-blue-500 outline-none transition-all shadow-lg" placeholder="Opsional jika PT diisi" />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Alamat Klien</label>
          <textarea value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:border-blue-500 outline-none transition-all shadow-lg" rows={2} placeholder="Alamat lengkap..." />
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Item Detail Pekerjaan</h3>
        </div>
        {items.map((it, idx) => (
          <InvoiceItemRow
            key={it.id}
            index={idx}
            item={it}
            onChange={(field, value) => handleItemChange(idx, field, value)}
            onRemove={() => handleRemoveItem(idx)}
          />
        ))}
        <button type="button" onClick={handleAddItem} className="mt-4 px-6 py-3 bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all active:scale-95">
          + Tambah Item Baru
        </button>
      </section>

      <section className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/40 p-6 rounded-[32px] border border-white/5">
        <div className="flex items-center justify-between p-4 bg-slate-900 border-2 border-white/10 rounded-2xl shadow-lg">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PPN</span>
            <span className="text-xs font-bold text-white">Kenakan 11%</span>
          </div>
          <input type="checkbox" checked={taxApplied} onChange={e => setTaxApplied(e.target.checked)} className="w-5 h-5 rounded border-white/10 bg-slate-800 text-blue-600 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Diskon (Rp)</label>
          <input type="number" value={discountAmount} onChange={e => setDiscountAmount(Number(e.target.value))} className="w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-red-400 focus:border-red-500 outline-none shadow-lg transition-all" placeholder="0" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Uang Muka (DP)</label>
          <input type="number" value={downPayment} onChange={e => setDownPayment(Number(e.target.value))} className="w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-emerald-400 focus:border-emerald-500 outline-none shadow-lg transition-all" placeholder="0" />
        </div>
        <div className="md:col-span-3">
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Catatan Tambahan</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-4 bg-slate-900 border-2 border-white/10 rounded-2xl text-sm font-black text-white focus:border-blue-500 outline-none shadow-lg transition-all" rows={2} placeholder="Tulis catatan di sini..." />
        </div>
      </section>

      <div className="mt-10 flex justify-end gap-4">
        <button type="button" onClick={onClose} className="px-8 py-3.5 bg-slate-900 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:text-white border border-white/5 transition-all active:scale-95">
          Batalkan
        </button>
        <button type="button" onClick={handleSave} className="px-10 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-2">
          <Save className="w-4 h-4" />
          Simpan Dokumen
        </button>
      </div>
    </div>
  );
}
