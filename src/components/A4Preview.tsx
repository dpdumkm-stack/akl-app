"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { QuotationData } from "@/lib/types";
import { calculatePages } from "@/lib/paginator";
import { formatCurrency } from "@/lib/utils";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";

interface A4PreviewProps {
    data: QuotationData;
    isGeneratingPDF: boolean;
    viewMode?: 'edit' | 'preview';
    globalLogoUrl?: string | null;
    globalTTDUrl?: string | null;
}

export default function A4Preview({ 
    data, isGeneratingPDF, viewMode = 'edit', globalLogoUrl, globalTTDUrl 
}: A4PreviewProps) {

    const [zoomLevel, setZoomLevel] = useState(1);
    const [windowWidth, setWindowWidth] = useState(1024);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

    useEffect(() => {
        setWindowWidth(window.innerWidth);
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const baseScale = useMemo(() => {
        if (windowWidth < 400) return 0.38;
        if (windowWidth < 640) return 0.42;
        if (windowWidth < 768) return 0.65;
        if (windowWidth < 1024) return 0.85;
        if (windowWidth < 1280) return 0.50; // Disesuaikan dari 0.55
        if (windowWidth < 1536) return 0.65; // Disesuaikan dari 0.75
        return 0.75; // Disesuaikan dari 0.85
    }, [windowWidth]);

    const currentScale = baseScale * zoomLevel;
    const activeScale = isGeneratingPDF ? 1 : currentScale;

    const PAPER_WIDTH = 794;
    const PAPER_HEIGHT = 1123;

    const pages = useMemo(() => calculatePages(data), [data]);

    const subTotal = useMemo(() => (data.items || []).reduce((acc, i) => {
        let price = data.isMaterialOnlyMode ? Number(i.hargaBahan || 0) : (data.isJasaBahanMode ? (Number(i.hargaBahan || 0) + Number(i.hargaJasa || 0)) : Number(i.harga || 0));
        return acc + (Number(i.volume || 0) * price);
    }, 0), [data.items, data.isJasaBahanMode, data.isMaterialOnlyMode]);

    const diskonAmount = Number(data.diskon || 0);
    const dpp = subTotal - diskonAmount;
    const ppnAmount = data.kenakanPPN ? dpp * 0.11 : 0;
    const total = dpp + ppnAmount;

    const handleMouseDownPan = (e: React.MouseEvent) => {
        if (e.button !== 2 && e.button !== 1) return;
        const container = previewContainerRef.current;
        if (!container) return;
        dragRef.current.isDragging = true;
        dragRef.current.startX = e.clientX;
        dragRef.current.startY = e.clientY;
        dragRef.current.scrollLeft = container.scrollLeft;
        dragRef.current.scrollTop = container.scrollTop;
        container.style.cursor = 'grabbing';
    };

    const handleMouseMovePan = (e: React.MouseEvent) => {
        if (!dragRef.current.isDragging) return;
        e.preventDefault();
        const container = previewContainerRef.current;
        if (!container) return;
        const walkX = (e.clientX - dragRef.current.startX) * 1.5;
        const walkY = (e.clientY - dragRef.current.startY) * 1.5;
        container.scrollLeft = dragRef.current.scrollLeft - walkX;
        container.scrollTop = dragRef.current.scrollTop - walkY;
    };

    const handleMouseUpOrLeavePan = () => {
        dragRef.current.isDragging = false;
        if (previewContainerRef.current) previewContainerRef.current.style.cursor = 'auto';
    };

    return (
        <div className={`lg:col-span-7 xl:col-span-8 ${viewMode === 'edit' ? 'hidden lg:flex' : 'flex'} relative print:static print:h-auto ${isGeneratingPDF ? 'h-auto static' : 'lg:h-[calc(100vh-4rem)] lg:sticky lg:top-8'}`}>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 right-6 z-50 flex lg:flex-col gap-1 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 no-print transition-all">
                <button type="button" onClick={() => setZoomLevel(z => Math.min(z + 0.1, 2.5))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600" title="Perbesar"><ZoomIn className="w-5 h-5" /></button>
                <div className="flex items-center justify-center p-1 text-[10px] font-black text-slate-500 w-10 select-none">{Math.round(zoomLevel * 100)}%</div>
                <button type="button" onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.4))} className="p-2 hover:bg-slate-100 rounded-xl text-slate-600" title="Perkecil"><ZoomOut className="w-5 h-5" /></button>
                <div className="w-px h-full lg:w-full lg:h-px bg-slate-200 my-0 lg:my-1"></div>
                <button type="button" onClick={() => setZoomLevel(1)} className="p-2 hover:bg-blue-50 rounded-xl text-blue-600" title="Normal 100%"><Maximize className="w-5 h-5" /></button>
            </div>

            <div
                ref={previewContainerRef}
                onMouseDown={handleMouseDownPan}
                onMouseUp={handleMouseUpOrLeavePan}
                onMouseLeave={handleMouseUpOrLeavePan}
                onMouseMove={handleMouseMovePan}
                onContextMenu={(e) => e.preventDefault()}
                className={`w-full bg-slate-200 lg:bg-transparent custom-scrollbar print:block print:w-full print:h-auto print:overflow-visible select-none ${isGeneratingPDF ? 'h-auto overflow-visible' : 'h-[calc(100dvh-80px)] lg:h-full overflow-auto'}`}
            >
                <div className={`flex min-h-full w-full ${isGeneratingPDF ? 'p-0 m-0' : 'p-4 lg:p-0'}`}>
                    <div
                        style={{
                            width: `${PAPER_WIDTH * activeScale}px`,
                            height: 'auto',
                            transition: (dragRef.current.isDragging || isGeneratingPDF) ? 'none' : 'all 0.25s ease-out'
                        }}
                        className={`flex-shrink-0 print:w-auto print:h-auto print:transition-none ${isGeneratingPDF ? 'absolute top-0 left-0 m-0' : 'relative m-auto'}`}
                    >

                        {/* Area Print */}
                        <div id="print-area"
                            style={{
                                width: `${PAPER_WIDTH}px`,
                                height: isGeneratingPDF ? `${pages.length * PAPER_HEIGHT}px` : 'auto',
                                overflow: isGeneratingPDF ? 'hidden' : 'visible',
                                transform: isGeneratingPDF ? 'none' : `scale(${activeScale})`,
                                transformOrigin: 'top left'
                            }}
                            className="bg-transparent print:static print:transform-none"
                        >

                            {pages.map((page, pageIndex) => {
                                const startIdx = pages.slice(0, pageIndex).reduce((acc, p) => acc + p.items.length, 0);
                                return (
                                    <div key={pageIndex}
                                        style={{ width: `${PAPER_WIDTH}px`, height: `${PAPER_HEIGHT}px`, maxHeight: `${PAPER_HEIGHT}px`, minHeight: `${PAPER_HEIGHT}px`, overflow: 'hidden', marginBottom: isGeneratingPDF ? '0px' : '32px' }}
                                        className={`a4-page bg-white flex flex-col relative flex-shrink-0 print:shadow-none ${isGeneratingPDF ? 'shadow-none' : 'shadow-2xl'} ${pageIndex > 0 ? 'pdf-page-break' : ''}`}
                                    >
                                        <div style={{ width: '100%', height: '15px', backgroundColor: '#1e3a8a' }} className="flex-shrink-0"></div>
                                        <div style={{ padding: '15px 40px 0px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="break-inside-avoid">
                                            <div style={{ width: '120px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                                {(data.logoUrl || globalLogoUrl) ? (
                                                    <img src={data.logoUrl || globalLogoUrl || ""} style={{ maxHeight: '80px', maxWidth: '100px', objectFit: 'contain' }} alt="Logo" />
                                                ) : (
                                                    <div style={{ width: '80px', height: '80px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>LOGO</div>
                                                )}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#1e3a8a', margin: '0 0 2px 0', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>PT. APINDO KARYA LESTARI</h1>
                                                <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', margin: '0 0 4px 0', letterSpacing: '2px', textTransform: 'uppercase' }}>SPESIALIS EPOXY LANTAI SEJAK 1987</p>
                                                <p style={{ fontSize: '10px', color: '#334155', margin: '0' }}>Jl. Raya Serpong KM.15 Ruko 17A, Tangerang Selatan</p>
                                                <p style={{ fontSize: '10px', color: '#334155', margin: '0' }}>Telp: (021) 5316 2972 | Email: apindokl@gmail.com | Web: www.apindokl.co.id</p>
                                            </div>
                                        </div>
                                        <div style={{ margin: '8px 40px 2px 40px', borderBottom: '3px solid #1e3a8a' }}></div>
                                        <div style={{ margin: '0 40px 10px 40px', borderBottom: '1px solid #dc2626' }}></div>

                                        <div style={{ padding: '0 40px 60px 40px', flexGrow: 1, display: 'flex', flexDirection: 'column' }} className="relative">

                                            {page.isFirstPage ? (
                                                <React.Fragment>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }} className="break-inside-avoid">
                                                        <div>
                                                            <table style={{ borderCollapse: 'collapse', border: 'none' }}>
                                                                <tbody>
                                                                    <tr><td style={{ width: '80px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '0px 0' }}>Nomor</td><td style={{ width: '10px', padding: '0px 0' }}>:</td><td style={{ fontWeight: '900', color: '#0f172a', padding: '0px 0' }}>{data.nomorSurat}</td></tr>
                                                                    <tr><td style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '0px 0' }}>Lampiran</td><td style={{ padding: '0px 0' }}>:</td><td style={{ color: '#334155', padding: '0px 0' }}>1 (Satu) Berkas</td></tr>
                                                                    <tr><td style={{ fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', padding: '0px 0' }}>Perihal</td><td style={{ padding: '0px 0' }}>:</td><td style={{ fontWeight: '900', color: '#1e3a8a', padding: '0px 0' }}>{data.isMaterialOnlyMode ? 'Penawaran Harga Material' : 'Penawaran Pekerjaan'}</td></tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <div style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                                                            {data.tanggal}
                                                        </div>
                                                    </div>

                                                    <div style={{ marginBottom: '10px', fontSize: '12px', color: '#0f172a' }} className="break-inside-avoid">
                                                        <p style={{ margin: '0 0 2px 0' }}>Kepada Yth,</p>
                                                        <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 2px 0' }}>{data.namaKlien || '---'}</h2>
                                                        <p style={{ margin: '0 0 2px 0', fontWeight: 'bold' }}>UP: Bapak/Ibu {data.up || '---'}</p>
                                                        {data.lokasi && <p style={{ margin: '0', fontStyle: 'italic', color: '#475569', fontSize: '10px' }}>Lokasi Proyek: {data.lokasi}</p>}
                                                        <p style={{ marginTop: '5px', marginBottom: '5px' }}>Dengan hormat,</p>
                                                        <p style={{ margin: '0', lineHeight: '1.3', textAlign: 'justify' }}>
                                                            {data.isMaterialOnlyMode 
                                                                ? "Bersama surat ini, kami bermaksud mengajukan penawaran harga material dengan rincian sebagai berikut:" 
                                                                : "Bersama surat ini, kami bermaksud mengajukan penawaran harga untuk pekerjaan tersebut dengan rincian sebagai berikut:"}
                                                        </p>
                                                    </div>
                                                </React.Fragment>
                                            ) : null}

                                            {/* TABLE */}
                                            {(page.items.length > 0 || page.hasSummary) ? (
                                                <div style={{ marginBottom: '25px' }}>
                                                    <table className="fixed-table break-inside-avoid" style={{ border: '1px solid #cbd5e1', fontSize: '11px', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                                        <thead style={{ backgroundColor: '#1e3a8a', color: 'white', display: 'table-header-group' }}>
                                                            <tr>
                                                                <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px', fontWeight: 'bold', fontSize: '10px' }}>NO</th>
                                                                <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', width: data.isHargaSatuanMode ? '50%' : '38%', fontSize: '10px' }}>{data.isMaterialOnlyMode ? 'MATERIAL' : 'URAIAN'}</th>
                                                                {!data.isHargaSatuanMode && <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '55px', fontWeight: 'bold', fontSize: '10px' }}>{data.isMaterialOnlyMode ? 'QTY' : 'VOL'}</th>}
                                                                <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '55px', fontWeight: 'bold', fontSize: '10px' }}>SATUAN</th>
                                                                {data.isJasaBahanMode ? (
                                                                    <React.Fragment>
                                                                        <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', width: '90px', fontWeight: 'bold', fontSize: '10px' }}>BAHAN</th>
                                                                        <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', width: '90px', fontWeight: 'bold', fontSize: '10px' }}>JASA</th>
                                                                    </React.Fragment>
                                                                ) : (
                                                                    <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', width: '110px', fontWeight: 'bold', fontSize: '10px' }}>HARGA/SAT</th>
                                                                )}
                                                                {!data.isHargaSatuanMode && <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', width: '110px', fontWeight: 'bold', fontSize: '10px' }}>TOTAL</th>}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {page.items.map((it: any, iIdx: number) => {
                                                                const currentItemNumber = startIdx + iIdx + 1;
                                                                const itemPrice = data.isMaterialOnlyMode ? Number(it.hargaBahan || 0) : data.isJasaBahanMode ? (Number(it.hargaBahan || 0) + Number(it.hargaJasa || 0)) : Number(it.harga || 0);
                                                                const rowBg = currentItemNumber % 2 === 0 ? '#ffffff' : '#f8fafc';
                                                                return (
                                                                    <tr key={it.id || iIdx} style={{ backgroundColor: rowBg, color: '#0f172a' }}>
                                                                        <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'top' }}>{currentItemNumber}</td>
                                                                        <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', verticalAlign: 'top' }}>
                                                                            <p style={{ margin: '0 0 2px 0', fontWeight: '900', textTransform: 'uppercase', fontSize: '10.5px', whiteSpace: 'pre-wrap' }}>{it.deskripsi || '---'}</p>
                                                                            {it.bahan && <p style={{ margin: '0', fontSize: '9.5px', fontStyle: 'italic', color: '#475569' }}>{it.bahan}</p>}
                                                                        </td>
                                                                        {!data.isHargaSatuanMode && <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'top' }}>{it.volume || 0}</td>}
                                                                        <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center', verticalAlign: 'top', color: '#475569', fontWeight: 'bold' }}>{it.satuan || 'm²'}</td>
                                                                        {data.isJasaBahanMode ? (
                                                                            <React.Fragment>
                                                                                <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(it.hargaBahan)}</td>
                                                                                <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(it.hargaJasa)}</td>
                                                                            </React.Fragment>
                                                                        ) : (
                                                                            <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'right', verticalAlign: 'top' }}>{formatCurrency(data.isMaterialOnlyMode ? it.hargaBahan : it.harga)}</td>
                                                                        )}
                                                                        {!data.isHargaSatuanMode && <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#1e3a8a', verticalAlign: 'top' }}>{formatCurrency(Number(it.volume || 0) * itemPrice)}</td>}
                                                                    </tr>
                                                                );
                                                            })}

                                                            {page.hasSummary && !data.isHargaSatuanMode && (() => {
                                                                // SAT selalu ada, VOL ada kecuali isHargaSatuanMode (sudah dijamin !isHargaSatuanMode di sini)
                                                                const totalCols = 1 + 1 + 1 + 1 + (data.isJasaBahanMode ? 2 : 1); // NO, URAIAN, VOL, SAT, HARGA or BAHAN+JASA
                                                                const spanCols = totalCols; // TOTAL column is 1 extra
                                                                return (
                                                                    <React.Fragment>
                                                                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                                            <td colSpan={spanCols} style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>Sub Total</td>
                                                                            <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(subTotal)}</td>
                                                                        </tr>
                                                                        {data.diskon > 0 && (
                                                                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                                                <td colSpan={spanCols} style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>Diskon</td>
                                                                                <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>- {formatCurrency(data.diskon)}</td>
                                                                            </tr>
                                                                        )}
                                                                        {data.kenakanPPN && (
                                                                            <tr style={{ backgroundColor: '#f1f5f9' }}>
                                                                                <td colSpan={spanCols} style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#475569' }}>PPN (11%)</td>
                                                                                <td style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold' }}>{formatCurrency(ppnAmount)}</td>
                                                                            </tr>
                                                                        )}
                                                                        <tr style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                                                                            <td colSpan={spanCols} style={{ padding: '12px 8px', border: '1px solid #1e3a8a', textAlign: 'right', fontWeight: '900', textTransform: 'uppercase' }}>Grand Total</td>
                                                                            <td style={{ padding: '12px 8px', border: '1px solid #1e3a8a', textAlign: 'right', fontWeight: '900' }}>{formatCurrency(total)}</td>
                                                                        </tr>
                                                                    </React.Fragment>
                                                                );
                                                            })()}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : null}

                                            {/* SYARAT */}
                                            {page.showLingkupSyarat && (data.showLingkupKerja || data.showSyaratGaransi) ? (
                                                <div style={{ display: 'flex', gap: '40px', marginBottom: '20px', fontSize: '11px', color: '#0f172a' }}>
                                                    {data.showLingkupKerja && (
                                                        <div style={{ flex: 1 }}>
                                                            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#1e3a8a', borderBottom: '2px solid #dc2626', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>I. Lingkup Kerja</h3>
                                                            {(data.lingkupKerja || []).filter(l => (l || '').trim() !== '').map((l, i) => (
                                                                <div key={i} style={{ display: 'flex', marginBottom: '4px' }}><div style={{ width: '15px' }}>{i + 1}.</div><div style={{ flex: 1 }}>{l}</div></div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {data.showSyaratGaransi && (
                                                        <div style={{ flex: 1 }}>
                                                            <h3 style={{ fontSize: '11px', fontWeight: '900', color: '#1e3a8a', borderBottom: '2px solid #dc2626', paddingBottom: '3px', marginBottom: '8px', textTransform: 'uppercase' }}>II. Syarat & Garansi</h3>
                                                            {(data.syaratGaransi || []).filter(s => (s || '').trim() !== '').map((s, i) => (
                                                                <div key={i} style={{ display: 'flex', marginBottom: '4px' }}><div style={{ width: '15px', color: '#dc2626' }}>•</div><div style={{ flex: 1 }}>{s}</div></div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : null}

                                            {/* FOOTER */}
                                            {page.showFooter && (
                                                <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                                                    <table style={{ width: '100%', fontSize: '11px', tableLayout: 'fixed', marginBottom: '10px' }}>
                                                        <tbody>
                                                            <tr>
                                                                <td style={{ width: '55%', verticalAlign: 'bottom', paddingRight: '15px' }}>
                                                                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', backgroundColor: '#f8fafc', borderLeft: '5px solid #1e3a8a' }}>
                                                                        <p style={{ fontWeight: 'bold', color: '#1e3a8a', margin: '0 0 6px 0', fontSize: '9px' }}>Metode Pembayaran:</p>
                                                                        <p style={{ fontWeight: '900', fontSize: '16px', margin: '0 0 2px 0' }}>35 - 75 - 125 - 798</p>
                                                                        <p style={{ fontSize: '8px', fontWeight: 'bold', color: '#475569', margin: '0 0 8px 0' }}>Bank Danamon BSD | A.N PT. APINDO KARYA LESTARI</p>
                                                                        <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '8px' }}>
                                                                            {(data.termin || []).filter(t => (t || '').trim() !== '').map((t, i) => (
                                                                                <div key={i} style={{ display: 'flex', marginBottom: '2px' }}><span style={{ width: '12px', color: '#16a34a' }}>✓</span><span style={{ fontSize: '9px' }}>{t}</span></div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td style={{ width: '45%', verticalAlign: 'bottom', textAlign: 'center' }}>
                                                                    <p style={{ margin: '0 0 4px 0', color: '#475569' }}>Hormat Kami,</p>
                                                                    <p style={{ fontWeight: 'bold', margin: '0', fontSize: '11px' }}>PT. APINDO KARYA LESTARI</p>
                                                                    <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyItems: 'center', margin: '2px 0' }}>
                                                                        {data.ttdStempelUrl ? <img src={data.ttdStempelUrl} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', margin: '0 auto' }} alt="TTD" /> : <div style={{ border: '1px dashed #cbd5e1', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>TTD</div>}
                                                                    </div>
                                                                    <p style={{ fontWeight: '900', textDecoration: 'underline', textTransform: 'uppercase', margin: '0 0 2px 0', fontSize: '11px' }}>{data.namaPenandatangan}</p>
                                                                    <p style={{ fontSize: '9px', textTransform: 'uppercase', margin: '0 0 2px 0' }}>{data.jabatanPenandatangan}</p>
                                                                    {data.phonePenandatangan && <p style={{ fontSize: '9px', color: '#475569', margin: '0 0 5px 0', fontWeight: 'bold' }}>Telp/WA: {data.phonePenandatangan}</p>}

                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                        </div>
                                        <div className="p-3 bg-blue-900 text-white text-[7px] flex justify-between items-center font-black uppercase tracking-[0.2em] w-full absolute bottom-0 left-0" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                                            <p>PT. Apindo KARYA LESTARI — Flooring Expert</p>
                                            <p className="opacity-60 tracking-normal">Halaman {pageIndex + 1} dari {pages.length}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
