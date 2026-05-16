"use client";

import React, { useState } from "react";
import { InvoiceData } from "@/lib/types";
import { getUniqueId } from "@/lib/utils";
import { Edit3, Plus, Settings2, Eye, Save, Loader2, Search } from "lucide-react";
import { getMasterItems, saveMasterItem, deleteMasterItem } from "@/app/actions";
import MasterItemModal from "./editor/MasterItemModal";
import InvoiceUmumSection from "./editor/InvoiceUmumSection";
import InvoiceItemRow from "./editor/InvoiceItemRow";
import InvoiceBiayaSection from "./editor/InvoiceBiayaSection";
import InvoiceImportModal from "./editor/InvoiceImportModal";
import { FileDown } from "lucide-react";

interface InvoiceFormEditorProps {
    data: InvoiceData;
    setData: React.Dispatch<React.SetStateAction<InvoiceData>>;
    isSaving: boolean;
    isGeneratingPDF: boolean;
    onSave: () => void;
    onDownloadPDF: () => void;
    viewMode?: 'edit' | 'preview';
    showToast: (msg: string, type?: 'success' | 'error') => void;
    setConfirmModal: (modal: any) => void;
    previewComponent?: React.ReactNode;
}

export default function InvoiceFormEditor({
    data, setData, isSaving, isGeneratingPDF, onSave, onDownloadPDF, viewMode = 'edit', showToast, setConfirmModal, previewComponent
}: InvoiceFormEditorProps) {

    const [masterItems, setMasterItems] = useState<any[]>([]);
    const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('umum'); // 'umum', 'item', 'biaya', 'preview'

    const tabs = [
        { id: 'umum', label: 'Umum', icon: <Edit3 className="w-4 h-4" /> },
        { id: 'item', label: 'Item', icon: <Plus className="w-4 h-4" /> },
        { id: 'biaya', label: 'Biaya', icon: <Settings2 className="w-4 h-4" /> },
        { id: 'preview', label: 'Preview PDF', icon: <Eye className="w-4 h-4" />, mobileOnly: true },
    ];

    React.useEffect(() => {
        getMasterItems().then(res => { if (res.success && 'data' in res) setMasterItems(res.data) });
    }, []);

    const updateItem = (id: string, field: string, value: any) => {
        setData(prev => ({ ...prev, items: (prev.items || []).map(i => i.id === id ? { ...i, [field]: value } : i) }));
    };

    const moveItem = (id: string, direction: 'up' | 'down') => {
        setData(prev => {
            const items = [...(prev.items || [])];
            const idx = items.findIndex(i => i.id === id);
            if (idx === -1) return prev;
            if (direction === 'up' && idx === 0) return prev;
            if (direction === 'down' && idx === items.length - 1) return prev;
            
            const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
            const temp = items[idx];
            items[idx] = items[targetIdx];
            items[targetIdx] = temp;
            
            return { ...prev, items };
        });
    };

    const handlePickMaster = (m: any) => {
        if (activeRowId) {
            setData(prev => {
                const newItems = (prev.items || []).map(i => i.id === activeRowId ? {
                    ...i, 
                    description: m.deskripsi, 
                    unitPrice: m.harga || 0,
                    volume: m.volume || '',
                    satuan: m.satuan || ''
                } : i);
                return { ...prev, items: newItems };
            });
        }
        setIsMasterModalOpen(false);
        setActiveRowId(null);
    };

    const handleDeleteMaster = async (e: React.MouseEvent, id: string, name: string) => {
        e.stopPropagation();
        setConfirmModal({
            title: "Hapus Master?",
            message: `Hapus "${name}" dari database item rutin secara permanen?`,
            onConfirm: async () => {
                const res = await deleteMasterItem(id);
                if (res.success) {
                    showToast("Item master berhasil dihapus.");
                    const updated = await getMasterItems();
                    if (updated.success && 'data' in updated) setMasterItems(updated.data);
                } else {
                    showToast("Gagal menghapus item master.", "error");
                }
            },
            confirmText: "Hapus",
            type: 'danger'
        });
    };

    const handleImport = (q: any) => {
        setIsImportModalOpen(false);
        showToast(`Mengimpor data dari Penawaran: ${q.nomorSurat}`);
        
        setData(prev => ({
            ...prev,
            clientName: q.up || q.namaKlien || prev.clientName,
            companyName: q.companyName || q.namaKlien || prev.companyName,
            clientAddress: q.lokasi || prev.clientAddress,
            quotationId: q.id,
            discountAmount: q.diskon || 0,
            taxApplied: q.kenakanPPN || false,
            items: (q.items || []).map((it: any) => {
                let unitPrice = 0;
                const hBahan = Number(it.hargaBahan) || 0;
                const hJasa = Number(it.hargaJasa) || 0;
                const hSatuan = Number(it.harga) || 0;
                if (q.isMaterialOnlyMode) unitPrice = hBahan;
                else if (q.isJasaBahanMode) unitPrice = hBahan + hJasa;
                else unitPrice = hSatuan;

                return {
                    id: getUniqueId(),
                    description: (it.deskripsi || "Tanpa Deskripsi") + (it.bahan ? ` (${it.bahan})` : ''),
                    quantity: 1,
                    volume: Number(it.volume) || 0,
                    satuan: it.satuan || '',
                    unitPrice: unitPrice
                };
            })
        }));
    };

    // Calculate Totals
    const subTotal = (data.items || []).reduce((acc, i) => {
        const vol = Number(i.volume);
        const price = Number(i.unitPrice) || 0;
        const lineTotal = vol > 0 ? vol * price : price;
        return acc + lineTotal;
    }, 0);
    const dpp = subTotal - Number(data.discountAmount || 0);
    const tax = data.taxApplied ? dpp * 0.11 : 0;
    const grandTotal = dpp + tax;
    
    const retentionPercent = Number(data.retentionPercent || 0);
    const retentionAmount = retentionPercent > 0 ? grandTotal * (retentionPercent / 100) : 0;
    
    const dp = Number(data.downPayment || 0);
    const isDPMode = data.invoiceType === 'DP';
    const isRetensiMode = data.invoiceType === 'RETENSI';
    
    let total = 0;
    if (isDPMode) {
        total = dp;
    } else if (isRetensiMode) {
        total = retentionAmount > 0 ? retentionAmount : Number(data.retentionAmount || 0);
    } else {
        total = grandTotal - dp - retentionAmount;
    }

    return (
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col h-full relative print:hidden">
            {/* TAB NAVIGATION - STICKY TOP */}
            <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 pb-2 mb-2 sm:mb-4">
                <div className="flex flex-col sm:flex-row justify-between gap-2 sm:items-center px-3 sm:px-0 pt-2">
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 sm:px-5 py-3.5 rounded-xl text-[10px] sm:text-[11px] font-black transition-all whitespace-nowrap ${tab.mobileOnly ? 'lg:hidden' : ''} ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-y-[-2px]' : 'bg-slate-900 text-slate-500 hover:bg-slate-800 border border-white/5'}`}>
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] sm:text-[11px] font-black transition-all shadow-lg shadow-emerald-900/20 whitespace-nowrap"
                    >
                        <FileDown className="w-4 h-4" /> IMPOR DARI PENAWARAN
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-6 pb-6">
                {activeTab === 'umum' && (
                    <InvoiceUmumSection 
                        data={data} 
                        setData={setData} 
                        nomorUrut={data.nomorUrut || 1} 
                        setNomorUrut={(n) => setData(prev => ({ ...prev, nomorUrut: n }))} 
                        showToast={showToast}
                    />
                )}

                {activeTab === 'item' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                        <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-white/5 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Plus className="w-3 h-3 text-blue-500" /> Daftar Item Tagihan
                                </h4>
                                <button 
                                    type="button" 
                                    onClick={() => { setActiveRowId(data.items[0]?.id || null); setIsMasterModalOpen(true); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-white/5 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                >
                                    <Search className="w-3.5 h-3.5" /> Database Master
                                </button>
                            </div>
                            
                            <div className="space-y-6 pr-1">
                                {(data.items || []).map((item) => (
                                    <InvoiceItemRow 
                                        key={item.id}
                                        item={item}
                                        data={data}
                                        onUpdate={updateItem}
                                        onMove={moveItem}
                                        onDelete={(id) => setData(prev => ({ ...prev, items: (prev.items || []).length > 1 ? prev.items.filter(i => i.id !== id) : prev.items }))}
                                        onOpenMaster={(id) => { setActiveRowId(id); setIsMasterModalOpen(true); }}
                                    />
                                ))}
                                <button 
                                    type="button" 
                                    onClick={() => setData(prev => ({ ...prev, items: [...(prev.items || []), { id: getUniqueId(), description: '', quantity: 1, volume: null, satuan: '', unitPrice: 0 }] }))} 
                                    className="w-full py-4 bg-slate-950/50 border-2 border-dashed border-white/5 rounded-3xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 transition-all shadow-inner"
                                >
                                    + TAMBAH BARIS ITEM
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'biaya' && (
                    <InvoiceBiayaSection data={data} setData={setData} subTotal={subTotal} total={total} />
                )}

                {activeTab === 'preview' && (
                    <div className="lg:hidden animate-in fade-in slide-in-from-bottom-2 duration-300 overflow-x-auto">
                        {previewComponent}
                    </div>
                )}
            </div>

            {/* ACTION FOOTER */}
            <div className="pt-6 pb-2 border-t border-white/5 bg-slate-950">
                <div className="flex flex-col-reverse md:flex-row gap-3">
                    <button 
                        type="button" 
                        onClick={onSave} 
                        disabled={isSaving} 
                        className={`w-full md:w-auto md:flex-1 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-500 hover:text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} 
                        <span className="uppercase tracking-[0.2em] text-[10px]">SIMPAN DRAF</span>
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={onDownloadPDF} 
                        disabled={isGeneratingPDF} 
                        className={`w-full md:w-auto md:flex-[1.5] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isGeneratingPDF ? 'opacity-50 cursor-wait' : 'hover:shadow-blue-900/40 hover:translate-y-[-2px]'}`}
                    >
                        {isGeneratingPDF ? <Loader2 className="animate-spin w-5 h-5" /> : <Eye className="w-5 h-5" />} 
                        <span className="uppercase tracking-[0.2em] text-[10px]">SIMPAN & PREVIEW PDF</span>
                    </button>
                </div>
            </div>

            <MasterItemModal 
                isOpen={isMasterModalOpen}
                onClose={() => setIsMasterModalOpen(false)}
                masterItems={masterItems}
                onPick={handlePickMaster}
                onDelete={handleDeleteMaster}
            />

            <InvoiceImportModal 
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
            />
        </div>
    );
}
