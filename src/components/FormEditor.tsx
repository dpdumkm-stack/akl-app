"use client";

import React, { useState } from "react";
import { QuotationData } from "@/lib/types";
import { formatCurrency, formatInputNumber, parseInputNumber, getUniqueId } from "@/lib/utils";
import {
    Settings2, ToggleRight, ToggleLeft, History, Plus, Search, Loader2,
    Trash2, Upload, Settings, BookmarkPlus, ChevronUp, Edit3, Phone, Save, Download, X, Clock
} from "lucide-react";
import { SIGNATORIES_BASE } from "@/lib/constants";
import { saveMasterItem, getMasterItems, deleteMasterItem, saveGlobalSetting } from "@/app/actions";
import MasterItemModal from "./editor/MasterItemModal";
import ItemRow from "./editor/ItemRow";
import UmumSection from "./editor/UmumSection";
import BiayaSection from "./editor/BiayaSection";
import KetentuanSection from "./editor/KetentuanSection";
import OtorisasiSection from "./editor/OtorisasiSection";

interface FormEditorProps {
    data: QuotationData;
    setData: React.Dispatch<React.SetStateAction<QuotationData>>;
    isSaving: boolean;
    isGeneratingPDF: boolean;
    onSave: () => void;
    onDownloadPDF: () => void;
    viewMode?: 'edit' | 'preview';
    showToast: (msg: string, type?: 'success' | 'error') => void;
    setConfirmModal: (modal: any) => void;
    globalLogoUrl?: string | null;
    globalTTDUrl?: string | null;
}

export default function FormEditor({
    data, setData, isSaving, isGeneratingPDF, onSave, onDownloadPDF, viewMode = 'edit', showToast, setConfirmModal,
    globalLogoUrl, globalTTDUrl
}: FormEditorProps) {


    const [masterItems, setMasterItems] = useState<any[]>([]);
    const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
    const [activeRowId, setActiveRowId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('umum'); // 'umum', 'item', 'biaya', 'syarat', 'ttd'

    const tabs = [
        { id: 'umum', label: 'Umum', icon: <Edit3 className="w-4 h-4" /> },
        { id: 'item', label: 'Item', icon: <Plus className="w-4 h-4" /> },
        { id: 'biaya', label: 'Biaya', icon: <Settings2 className="w-4 h-4" /> },
        { id: 'syarat', label: 'Ketentuan', icon: <Clock className="w-4 h-4" /> },
        { id: 'ttd', label: 'Pengesahan', icon: <Phone className="w-4 h-4" /> },
    ];

    React.useEffect(() => {
        getMasterItems().then(res => { if (res.success && 'data' in res) setMasterItems(res.data) });
    }, []);

    const handleSaveToMaster = async (item: any, asNew: boolean = false) => {
        if (!item.deskripsi || !item.deskripsi.trim()) { showToast('Deskripsi item tidak boleh kosong!', 'error'); return; }
        
        const isUpdate = item.masterId && !asNew;
        
        setConfirmModal({
            title: isUpdate ? "Update Master?" : "Simpan ke Master?",
            message: isUpdate 
                ? `Update data "${item.deskripsi}" di database master?` 
                : (asNew ? `Simpan "${item.deskripsi}" sebagai item baru di database?` : `Simpan "${item.deskripsi}" ke database pekerjaan rutin?`),
            onConfirm: () => doSaveToMaster(item, asNew),
            confirmText: isUpdate ? "Update Sekarang" : "Simpan Item",
            type: 'primary'
        });
    };

    const doSaveToMaster = async (item: any, asNew: boolean = false) => {
        const res = await saveMasterItem({
            ...item,
            id: asNew ? undefined : item.masterId, // Hilangkan ID jika ingin simpan baru
        });
        if (res.success) {
            showToast(`"${item.deskripsi}" disimpan ke Master!`);
            const updated = await getMasterItems();
            if (updated.success && 'data' in updated) setMasterItems(updated.data);
        } else {
            showToast(`Gagal: ${(res as any).message || 'Error'}`, 'error');
        }
    };

    const handlePickMaster = (m: any) => {
        if (activeRowId) {
            setData(prev => {
                const newItems = (prev.items || []).map(i => i.id === activeRowId ? {
                    ...i, 
                    deskripsi: m.deskripsi, 
                    bahan: m.bahan || '', 
                    satuan: m.satuan || 'm²', 
                    harga: m.harga, 
                    hargaBahan: m.hargaBahan, 
                    hargaJasa: m.hargaJasa,
                    masterId: m.id // Track ID master untuk edit nantinya
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

    const updateItem = (id: string, field: string, value: any) => {
        setData(prev => ({ ...prev, items: (prev.items || []).map(i => i.id === id ? { ...i, [field]: value } : i) }));
    };

    const detachFromMaster = (id: string) => {
        setData(prev => ({
            ...prev,
            items: (prev.items || []).map(i => i.id === id ? { ...i, masterId: undefined } : i)
        }));
        showToast("Item dilepaskan dari Database Master.");
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

    const subTotal = (data.items || []).reduce((acc, i) => {
        let price = data.isMaterialOnlyMode ? Number(i.hargaBahan || 0) : (data.isJasaBahanMode ? (Number(i.hargaBahan || 0) + Number(i.hargaJasa || 0)) : Number(i.harga || 0));
        return acc + (Number(i.volume || 0) * price);
    }, 0);
    const total = subTotal - Number(data.diskon || 0) + (data.kenakanPPN ? (subTotal - Number(data.diskon || 0)) * 0.11 : 0);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'ttdStempelUrl') => {
        const file = e.target.files?.[0]; if (!file) return;
        showToast("Memproses gambar...");
        
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target?.result as string;
                const maxWidth = field === 'logoUrl' ? 400 : 300;
                
                // Gunakan utilitas kompresi baru (JPEG lebih ringan dari PNG)
                const { compressImage } = await import("@/lib/image-utils");
                const compressedBase64 = await compressImage(base64, maxWidth, 0.8);
                
                setData(prev => ({ ...prev, [field]: compressedBase64 }));

                if (field === 'logoUrl') {
                    saveGlobalSetting('LOGO', compressedBase64).then(res => {
                        if (res.success) showToast("Logo diperbarui sebagai Identitas Korporat!");
                    });
                } else {
                    setConfirmModal({
                        title: "Simpan sebagai TTD Default?",
                        message: "Gunakan tanda tangan ini sebagai default untuk penawaran baru?",
                        onConfirm: async () => {
                            const res = await saveGlobalSetting('TTD', compressedBase64);
                            if (res.success) showToast("TTD disimpan sebagai default!");
                        },
                        confirmText: "Simpan Default",
                        type: 'primary'
                    });
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Gagal memproses gambar:", error);
            showToast("Gagal memproses gambar.", "error");
        }
    };

    return (
        <div className={`lg:col-span-5 xl:col-span-4 flex flex-col h-full relative ${viewMode === 'preview' ? 'hidden lg:flex' : 'flex'} print:hidden`}>
            {/* TAB NAVIGATION - STICKY TOP */}
            <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/5 pb-2 mb-4">
                <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 translate-y-[-2px]' : 'bg-slate-900 text-slate-500 hover:bg-slate-800 border border-white/5'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            {/* CONTENT AREA - INDEPENDENT SCROLL */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-1 space-y-6">
                {activeTab === 'umum' && (
                    <UmumSection 
                        data={data} 
                        setData={setData} 
                        nomorUrut={data.nomorUrut || 1} 
                        setNomorUrut={(n) => setData(prev => ({ ...prev, nomorUrut: n }))} 
                        showToast={showToast}
                    />
                )}

                {activeTab === 'item' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                        <div className="bg-slate-900 p-6 rounded-3xl border border-white/5 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Plus className="w-3 h-3 text-blue-500" />
                                    {data.isMaterialOnlyMode ? 'Daftar Material' : 'Daftar Pekerjaan'}
                                </h4>
                                <button 
                                    type="button" 
                                    onClick={() => { setActiveRowId(data.items[0]?.id || null); setIsMasterModalOpen(true); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-white/5 text-slate-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                >
                                    <Search className="w-3.5 h-3.5" />
                                    Cari dari Database
                                </button>
                            </div>
                            <div className="space-y-6 pr-1">
                                {(data.items || []).map((item) => (
                                    <ItemRow 
                                        key={item.id}
                                        item={item}
                                        data={data}
                                        onUpdate={updateItem}
                                        onMove={moveItem}
                                        onDelete={(id) => setData(prev => ({ ...prev, items: (prev.items || []).length > 1 ? prev.items.filter(i => i.id !== id) : prev.items }))}
                                        onOpenMaster={(id) => { setActiveRowId(id); setIsMasterModalOpen(true); }}
                                        onSaveMaster={handleSaveToMaster}
                                        onDetachMaster={detachFromMaster}
                                    />
                                ))}
                                <button type="button" onClick={() => setData(prev => ({ ...prev, items: [...(prev.items || []), { id: getUniqueId(), deskripsi: '', bahan: '', volume: 0, satuan: 'm²', harga: 0, hargaBahan: 0, hargaJasa: 0 }] }))} className="w-full py-4 bg-slate-950/50 border-2 border-dashed border-white/5 rounded-3xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:border-blue-500/50 hover:text-blue-400 transition-all shadow-inner">+ TAMBAH BARIS</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'biaya' && (
                    <BiayaSection data={data} setData={setData} subTotal={subTotal} total={total} />
                )}

                {activeTab === 'syarat' && (
                    <KetentuanSection data={data} setData={setData} />
                )}

                {activeTab === 'ttd' && (
                    <OtorisasiSection 
                        data={data} 
                        setData={setData} 
                        onFileUpload={handleFileUpload} 
                        showToast={showToast}
                        setConfirmModal={setConfirmModal}
                        globalLogoUrl={globalLogoUrl}
                        globalTTDUrl={globalTTDUrl}
                    />
                )}
            </div>

            {/* ACTION FOOTER - FIXED POSITION AT BOTTOM (NOT OVERLAYING) */}
            <div className="pt-6 pb-2 border-t border-white/5 bg-slate-950">
                <div className="flex gap-3">
                    <button 
                        type="button" 
                        onClick={onSave} 
                        disabled={isSaving} 
                        className={`flex-1 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-500 hover:text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                        {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} 
                        <span className="uppercase tracking-[0.2em] text-[10px]">SIMPAN DRAF</span>
                    </button>
                    
                    <button 
                        type="button" 
                        onClick={onDownloadPDF} 
                        disabled={isGeneratingPDF} 
                        className={`flex-[1.5] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isGeneratingPDF ? 'opacity-50 cursor-wait' : 'hover:shadow-blue-900/40 hover:translate-y-[-2px]'}`}
                    >
                        {isGeneratingPDF ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />} 
                        <span className="uppercase tracking-[0.2em] text-[10px]">SIMPAN & UNDUH PDF</span>
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
        </div>
    );
}
