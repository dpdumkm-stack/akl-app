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
        getMasterItems().then(res => { if (res.success && res.data) setMasterItems(res.data) });
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
            if (updated.success && updated.data) setMasterItems(updated.data);
        } else {
            showToast(`Gagal: ${res.message || 'Error'}`, 'error');
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
                    if (updated.success && updated.data) setMasterItems(updated.data);
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

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'ttdStempelUrl') => {
        const file = e.target.files?.[0]; if (!file) return;
        showToast("Memproses gambar...");
        const reader = new FileReader();
        reader.onload = (event) => { 
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = field === 'logoUrl' ? 300 : 250; 
                let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/png', 0.8);
                    setData(prev => ({ ...prev, [field]: compressedBase64 })); 
                    
                    if (field === 'logoUrl') {
                        // OTOMATIS: Hanya Logo yang permanen (Corporate Identity)
                        saveGlobalSetting('LOGO', compressedBase64).then(res => {
                            if (res.success) showToast("Logo diperbarui sebagai Identitas Korporat permanen!");
                        });
                    } else {
                        // DINAMIS: Tanda Tangan tetap ditanya apakah ingin jadi default (opsional)
                        setConfirmModal({
                            title: "Simpan sebagai TTD Default?",
                            message: "Apakah Anda ingin menyimpan tanda tangan ini sebagai default untuk penawaran baru berikutnya?",
                            onConfirm: async () => {
                                const res = await saveGlobalSetting('TTD', compressedBase64);
                                if (res.success) showToast("TTD disimpan sebagai default baru!");
                            },
                            confirmText: "Simpan Default",
                            type: 'primary'
                        });
                    }
                }


            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className={`lg:col-span-5 xl:col-span-4 flex flex-col h-full relative ${viewMode === 'preview' ? 'hidden lg:flex' : 'flex'} print:hidden`}>
            {/* TAB NAVIGATION - STICKY TOP */}
            <div className="sticky top-0 z-40 bg-slate-100/80 backdrop-blur-md border-b border-slate-200 pb-2 mb-4">
                <div className="flex gap-1 overflow-x-auto no-scrollbar py-2">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 translate-y-[-2px]' : 'bg-white text-slate-400 hover:bg-slate-50 border border-transparent hover:border-slate-200'}`}>
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 space-y-6 pb-24">
                {activeTab === 'umum' && (
                    <UmumSection 
                        data={data} 
                        setData={setData} 
                        nomorUrut={data.nomorUrut || 1} 
                        setNomorUrut={(n) => setData(prev => ({ ...prev, nomorUrut: n }))} 
                    />
                )}

                {activeTab === 'item' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Plus className="w-3 h-3 text-blue-500" />
                                    {data.isMaterialOnlyMode ? 'Daftar Material' : 'Daftar Pekerjaan'}
                                </h4>
                                <button 
                                    type="button" 
                                    onClick={() => { setActiveRowId(data.items[0]?.id || null); setIsMasterModalOpen(true); }}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
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
                                <button type="button" onClick={() => setData(prev => ({ ...prev, items: [...(prev.items || []), { id: getUniqueId(), deskripsi: '', bahan: '', volume: 0, satuan: 'm²', harga: 0, hargaBahan: 0, hargaJasa: 0 }] }))} className="w-full py-4 bg-white border-2 border-dashed border-slate-200 rounded-3xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:border-blue-400 hover:text-blue-500 transition-all shadow-sm">+ TAMBAH BARIS</button>
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

            {/* STICKY ACTION FOOTER */}
            <div className="absolute bottom-0 left-[-1.5rem] right-[-1.5rem] p-6 bg-gradient-to-t from-slate-100 via-slate-100/95 to-transparent z-40 pointer-events-none">
                <div className="flex gap-4 pointer-events-auto">
                    <button type="button" onClick={onSave} disabled={isSaving} className={`flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isSaving ? 'opacity-50 cursor-wait' : 'hover:shadow-green-200 hover:translate-y-[-2px]'}`}>{isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save className="w-5 h-5" />} <span className="uppercase tracking-widest text-[11px]">SIMPAN DRAF</span></button>
                    <button type="button" onClick={onDownloadPDF} disabled={isGeneratingPDF} className={`flex-1 bg-gradient-to-r from-blue-800 to-slate-900 text-white font-black py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 ${isGeneratingPDF ? 'opacity-50 cursor-wait' : 'hover:shadow-blue-200 hover:translate-y-[-2px]'}`}>{isGeneratingPDF ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />} <span className="uppercase tracking-widest text-[11px]">SIMPAN & UNDUH PDF</span></button>
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
