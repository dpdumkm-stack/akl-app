"use client";

import React, { useMemo } from "react";
import { QuotationData } from "@/lib/types";
import { calculatePages } from "@/lib/paginator";
import { formatCurrency } from "@/lib/utils";

// ─── Terbilang (Indonesian Number-to-Words) ──────────────────────────────────
const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
    'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
const puluhan = ['', '', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh',
    'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];

function terbilangGroup(n: number): string {
    if (n === 0) return '';
    if (n < 20) return satuan[n];
    if (n < 100) return puluhan[Math.floor(n / 10)] + (n % 10 ? ' ' + satuan[n % 10] : '');
    if (n < 1000) {
        const h = Math.floor(n / 100);
        const rem = n % 100;
        return (h === 1 ? 'Seratus' : satuan[h] + ' Ratus') + (rem ? ' ' + terbilangGroup(rem) : '');
    }
    return '';
}

function terbilang(n: number): string {
    n = Math.round(Math.abs(n));
    if (n === 0) return 'Nol Rupiah';
    const t = Math.floor(n);
    const triliun = Math.floor(t / 1_000_000_000_000);
    const miliar = Math.floor((t % 1_000_000_000_000) / 1_000_000_000);
    const juta = Math.floor((t % 1_000_000_000) / 1_000_000);
    const ribu = Math.floor((t % 1_000_000) / 1_000);
    const sisa = t % 1_000;
    let result = '';
    if (triliun) result += terbilangGroup(triliun) + ' Triliun ';
    if (miliar) result += terbilangGroup(miliar) + ' Miliar ';
    if (juta) result += terbilangGroup(juta) + ' Juta ';
    if (ribu) result += (ribu === 1 ? 'Seribu' : terbilangGroup(ribu) + ' Ribu') + ' ';
    if (sisa) result += terbilangGroup(sisa);
    return result.trim() + ' Rupiah';
}

interface A4PreviewProps {
    data: QuotationData;
    isGeneratingPDF: boolean;
    globalLogoUrl?: string | null;
    globalTTDUrl?: string | null;
}

const A4Preview = ({ 
    data, isGeneratingPDF, globalLogoUrl, globalTTDUrl 
}: A4PreviewProps) => {

    const PAPER_WIDTH = 794;
    const PAPER_HEIGHT = 1123;

    const pages = useMemo(() => calculatePages(data), [data]);

    const subTotal = useMemo(() => (data.items || []).reduce((acc, i) => {
        let price = data.isMaterialOnlyMode ? Number(i.hargaBahan || 0) : (data.isJasaBahanMode ? (Number(i.hargaBahan || 0) + Number(i.hargaJasa || 0)) : Number(i.harga || 0));
        return acc + (Number(i.volume || 0) * price);
    }, 0), [data.items, data.isJasaBahanMode, data.isMaterialOnlyMode]);

    const totalBahan = useMemo(() => (data.items || []).reduce((acc, i) => acc + (Number(i.volume || 0) * Number(i.hargaBahan || 0)), 0), [data.items]);
    const totalJasa = useMemo(() => (data.items || []).reduce((acc, i) => acc + (Number(i.volume || 0) * Number(i.hargaJasa || 0)), 0), [data.items]);

    const diskonAmount = Number(data.diskon || 0);
    const dpp = subTotal - diskonAmount;
    const ppnAmount = data.kenakanPPN ? dpp * 0.11 : 0;
    const total = dpp + ppnAmount;

    // --- DYNAMIC WIDTH CALCULATION ---
    const maxVal = Math.max(subTotal, total);
    const priceStr = formatCurrency(maxVal);
    const dynamicPriceWidth = Math.max(110, priceStr.length * 8.2);
    const dynamicPriceWidthPx = `${dynamicPriceWidth}px`;

    const maxBahanJasa = Math.max(totalBahan, totalJasa);
    const bahanJasaWidth = Math.max(90, formatCurrency(maxBahanJasa).length * 7.5);
    const bahanJasaWidthPx = `${bahanJasaWidth}px`;

    return (
        <div 
            id="print-area"
            className="flex flex-col items-center bg-transparent select-none"
            style={{ 
                width: `${PAPER_WIDTH}px`,
                transformOrigin: 'top center'
            }}
        >
            <div className="flex flex-col">
                {pages.map((page, pageIndex) => {
                    const startIdx = pages.slice(0, pageIndex).reduce((acc, p) => acc + p.items.length, 0);
                    return (
                        <div key={pageIndex}
                            style={{ 
                                width: `${PAPER_WIDTH}px`, 
                                height: `${PAPER_HEIGHT}px`, 
                                maxHeight: `${PAPER_HEIGHT}px`, 
                                minHeight: `${PAPER_HEIGHT}px`, 
                                overflow: 'hidden',
                                backgroundColor: 'white',
                                color: '#000000',
                                fontFamily: 'Arial, sans-serif',
                                position: 'relative',
                                marginBottom: isGeneratingPDF ? '0px' : '32px',
                                boxShadow: isGeneratingPDF ? 'none' : '0 25px 50px -12px rgb(0 0 0 / 0.25)'
                            }}
                            className={`a4-page flex flex-col flex-shrink-0 ${pageIndex > 0 ? 'pdf-page-break' : ''}`}
                        >
                            <div style={{ width: '100%', height: '15px', backgroundColor: '#1e3a8a' }} className="flex-shrink-0"></div>
                            
                            {/* DYNAMIC HEADER */}
                            <div style={{ padding: '15px 40px 0px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ width: '120px', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    {(() => {
                                        const logoToDisplay = (data.logoUrl && data.logoUrl !== "" && data.logoUrl !== "null" && data.logoUrl !== "undefined") 
                                            ? data.logoUrl 
                                            : globalLogoUrl;
                                        
                                        if (logoToDisplay && logoToDisplay !== "" && logoToDisplay !== "null" && logoToDisplay !== "undefined") {
                                            return (
                                                <img 
                                                    src={logoToDisplay} 
                                                    style={{ maxHeight: pageIndex === 0 ? '80px' : '40px', maxWidth: '100px', objectFit: 'contain' }} 
                                                    alt="Logo" 
                                                />
                                            );
                                        }
                                        
                                        return (
                                            <div style={{ width: pageIndex === 0 ? '80px' : '40px', height: pageIndex === 0 ? '80px' : '40px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>LOGO</div>
                                        );
                                    })()}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h1 style={{ fontSize: pageIndex === 0 ? '22px' : '14px', fontWeight: '900', color: '#1e3a8a', margin: '0 0 2px 0', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>PT. APINDO KARYA LESTARI</h1>
                                    {pageIndex === 0 && (
                                        <>
                                            <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', margin: '0 0 4px 0', letterSpacing: '2px', textTransform: 'uppercase' }}>SPESIALIS EPOXY LANTAI SEJAK 1987</p>
                                            <p style={{ fontSize: '10px', color: '#334155', margin: '0' }}>Jl. Raya Serpong KM.15 Ruko 17A, Tangerang Selatan</p>
                                            <p style={{ fontSize: '10px', color: '#334155', margin: '0' }}>Telp: (021) 5316 2972 | Email: apindokl@gmail.com | Web: www.apindokl.co.id</p>
                                        </>
                                    )}
                                    {pageIndex > 0 && (
                                        <p style={{ fontSize: '9px', fontWeight: 'bold', color: '#64748b', margin: '0', textTransform: 'uppercase' }}>Quotation: {data.nomorSurat} — Hal {pageIndex + 1}</p>
                                    )}
                                </div>
                            </div>
                            <div style={{ margin: pageIndex === 0 ? '8px 40px 2px 40px' : '4px 40px 2px 40px', borderBottom: '3px solid #1e3a8a' }}></div>
                            <div style={{ margin: '0 40px 10px 40px', borderBottom: '1px solid #dc2626' }}></div>

                            <div style={{ padding: '0 40px 60px 40px', flexGrow: 1, display: 'flex', flexDirection: 'column' }} className="relative">
                                {page.isFirstPage ? (
                                    <React.Fragment>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px' }}>
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

                                        <div style={{ marginBottom: '10px', fontSize: '12px', color: '#0f172a' }}>
                                            <p style={{ margin: '0 0 2px 0' }}>Kepada Yth,</p>
                                            {data.companyName ? (
                                                <>
                                                    <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 2px 0' }}>
                                                        {data.companyName}
                                                    </h2>
                                                    {data.up && (
                                                        <p style={{ margin: '0 0 2px 0', fontWeight: 'bold', fontSize: '11px' }}>U.P.: {data.up}</p>
                                                    )}
                                                </>
                                            ) : (
                                                <h2 style={{ fontSize: '14px', fontWeight: '900', color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 2px 0' }}>
                                                    {data.up || data.namaKlien || '---'}
                                                </h2>
                                            )}
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
                                        <table style={{ border: '1px solid #cbd5e1', fontSize: '11px', width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                            <thead style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                                                <tr>
                                                    <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '40px', fontWeight: 'bold', fontSize: '10px' }}>NO</th>
                                                    <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'left', fontWeight: 'bold', width: data.isHargaSatuanMode ? '50%' : '38%', fontSize: '10px' }}>{data.isMaterialOnlyMode ? 'MATERIAL' : 'URAIAN'}</th>
                                                    {!data.isHargaSatuanMode && <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '55px', fontWeight: 'bold', fontSize: '10px' }}>{data.isMaterialOnlyMode ? 'QTY' : 'VOL'}</th>}
                                                    <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'center', width: '55px', fontWeight: 'bold', fontSize: '10px' }}>SATUAN</th>
                                                    {data.isJasaBahanMode ? (
                                                        <React.Fragment>
                                                            <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', width: bahanJasaWidthPx, fontWeight: 'bold', fontSize: '10px' }}>BAHAN</th>
                                                            <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', width: bahanJasaWidthPx, fontWeight: 'bold', fontSize: '10px' }}>JASA</th>
                                                        </React.Fragment>
                                                    ) : (
                                                        <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', width: dynamicPriceWidthPx, fontWeight: 'bold', fontSize: '10px' }}>HARGA/SAT</th>
                                                    )}
                                                    {!data.isHargaSatuanMode && <th style={{ padding: '5px', border: '1px solid #cbd5e1', textAlign: 'right', width: dynamicPriceWidthPx, fontWeight: 'bold', fontSize: '10px' }}>TOTAL</th>}
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

                                                {page.hasSummary && !data.isHargaSatuanMode && (
                                                    <React.Fragment>
                                                        {/* --- SECTION TOTAL (ACCOUNTING STYLE) --- */}
                                                        <tr>
                                                            <td colSpan={data.isJasaBahanMode ? 7 : 6} style={{ height: '4px', border: 'none' }}></td>
                                                        </tr>
                                                        
                                                        {/* Breakdowns for Bahan & Jasa Mode */}
                                                        {data.isJasaBahanMode && (
                                                            <React.Fragment>
                                                                <tr>
                                                                    <td colSpan={6} style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', borderLeft: '1px solid #cbd5e1', borderTop: '1px solid #cbd5e1' }}>Total Bahan</td>
                                                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#475569', border: '1px solid #cbd5e1', width: dynamicPriceWidthPx }}>{formatCurrency(totalBahan)}</td>
                                                                </tr>
                                                                <tr>
                                                                    <td colSpan={6} style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 'bold', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', borderLeft: '1px solid #cbd5e1' }}>Total Upah</td>
                                                                    <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: '#475569', border: '1px solid #cbd5e1', width: dynamicPriceWidthPx }}>{formatCurrency(totalJasa)}</td>
                                                                </tr>
                                                            </React.Fragment>
                                                        )}

                                                        {/* Subtotal */}
                                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                                            <td colSpan={data.isJasaBahanMode ? 6 : 5} style={{ padding: '8px 12px', textAlign: 'right', fontWeight: '900', color: '#1e3a8a', fontSize: '10px', textTransform: 'uppercase', borderLeft: '1px solid #cbd5e1', borderTop: '2px solid #cbd5e1' }}>Sub Total Keseluruhan</td>
                                                            <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: '900', color: '#1e3a8a', border: '1px solid #cbd5e1', width: dynamicPriceWidthPx, borderTop: '2px solid #cbd5e1' }}>{formatCurrency(subTotal)}</td>
                                                        </tr>

                                                        {/* Diskon */}
                                                        {data.diskon > 0 && (
                                                            <tr>
                                                                <td colSpan={data.isJasaBahanMode ? 6 : 5} style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626', fontSize: '10px', textTransform: 'uppercase', border: '1px solid #cbd5e1' }}>Potongan Harga / Diskon</td>
                                                                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626', border: '1px solid #cbd5e1', width: dynamicPriceWidthPx }}>- {formatCurrency(data.diskon)}</td>
                                                            </tr>
                                                        )}

                                                        {/* DPP (If PPN) */}
                                                        {data.kenakanPPN && (
                                                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                                                <td colSpan={data.isJasaBahanMode ? 6 : 5} style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '10px', textTransform: 'uppercase', border: '1px solid #cbd5e1' }}>DPP (Dasar Pengenaan Pajak)</td>
                                                                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', border: '1px solid #cbd5e1', width: dynamicPriceWidthPx }}>{formatCurrency(dpp)}</td>
                                                            </tr>
                                                        )}

                                                        {/* PPN */}
                                                        {data.kenakanPPN && (
                                                            <tr style={{ backgroundColor: '#f8fafc' }}>
                                                                <td colSpan={data.isJasaBahanMode ? 6 : 5} style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '10px', textTransform: 'uppercase', border: '1px solid #cbd5e1' }}>PPN (11%)</td>
                                                                <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 'bold', color: '#0f172a', border: '1px solid #cbd5e1', width: dynamicPriceWidthPx }}>{formatCurrency(ppnAmount)}</td>
                                                            </tr>
                                                        )}

                                                        {/* Grand Total */}
                                                        <tr style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                                                            <td colSpan={data.isJasaBahanMode ? 6 : 5} style={{ padding: '10px 12px', border: '1px solid #1e3a8a', textAlign: 'right', fontWeight: '900', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '1px' }}>Total Akhir (Grand Total)</td>
                                                            <td style={{ padding: '5px 8px', border: '1px solid #1e3a8a', textAlign: 'right', fontWeight: '900', fontSize: '13px', borderLeft: '1px solid rgba(255,255,255,0.2)', width: dynamicPriceWidthPx }}>{formatCurrency(total)}</td>
                                                        </tr>

                                                        {/* Terbilang Row */}
                                                        <tr>
                                                            <td colSpan={data.isJasaBahanMode ? 7 : 6} style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderTop: 'none', backgroundColor: '#fcfcfc' }}>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Terbilang:</span>
                                                                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0f172a', fontStyle: 'italic' }}>
                                                                        ## {terbilang(total)} ##
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                )}
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
                                                            {(data.ttdStempelUrl || globalTTDUrl) ? (
                                                                <img 
                                                                    src={data.ttdStempelUrl || globalTTDUrl || ""} 
                                                                    style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', margin: '0 auto' }} 
                                                                    alt="TTD" 
                                                                />
                                                            ) : (
                                                                <div style={{ border: '1px dashed #cbd5e1', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>TTD</div>
                                                            )}
                                                        </div>
                                                        <p style={{ fontWeight: '900', textDecoration: 'underline', textTransform: 'uppercase', margin: '0 0 2px 0', fontSize: '11px' }}>{data.namaPenandatangan || "MUDINI NURAFIN"}</p>
                                                        <p style={{ fontSize: '9px', textTransform: 'uppercase', margin: '0 0 2px 0' }}>{data.jabatanPenandatangan || "PRINSIPAL"}</p>
                                                        {data.phonePenandatangan && <p style={{ fontSize: '9px', color: '#475569', margin: '0 0 5px 0', fontWeight: 'bold' }}>Telp/WA: {data.phonePenandatangan}</p>}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="p-3 bg-blue-900 text-white text-[7px] flex justify-between items-center font-black uppercase tracking-[0.2em] w-full absolute bottom-0 left-0">
                                <p>PT. Apindo KARYA LESTARI — Flooring Expert</p>
                                <p className="opacity-60 tracking-normal">Halaman {pageIndex + 1} dari {pages.length}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(A4Preview);
