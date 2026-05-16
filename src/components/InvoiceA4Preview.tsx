"use client";

import React, { useMemo } from "react";
import { calculatePages } from "@/lib/paginator";

interface InvoiceA4PreviewProps {
    data: any;
    isGeneratingPDF: boolean;
    globalLogoUrl?: string | null;
}

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
  const miliar  = Math.floor((t % 1_000_000_000_000) / 1_000_000_000);
  const juta    = Math.floor((t % 1_000_000_000) / 1_000_000);
  const ribu    = Math.floor((t % 1_000_000) / 1_000);
  const sisa    = t % 1_000;

  let result = '';
  if (triliun) result += terbilangGroup(triliun) + ' Triliun ';
  if (miliar)  result += terbilangGroup(miliar)  + ' Miliar ';
  if (juta)    result += terbilangGroup(juta)    + ' Juta ';
  if (ribu) {
    result += (ribu === 1 ? 'Seribu' : terbilangGroup(ribu) + ' Ribu') + ' ';
  }
  if (sisa)    result += terbilangGroup(sisa);

  return result.trim() + ' Rupiah';
}

// ─── Formatter ───────────────────────────────────────────────────────────
const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(n).replace('IDR', 'Rp').replace('Rp', 'Rp ').replace(/\s+/, ' ');

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

const InvoiceA4Preview = ({ data, isGeneratingPDF, globalLogoUrl }: InvoiceA4PreviewProps) => {
  const pages = useMemo(() => calculatePages(data), [data]);

  // Financial calculations
  const subtotal = (data.items || []).reduce((acc: number, i: any) => {
      const vol = Number(i.volume);
      const price = Number(i.unitPrice) || 0;
      return acc + (vol > 0 ? vol * price : price);
  }, 0);
  const discountAmount = Number(data.discountAmount || 0);
  const dpp = subtotal - discountAmount;
  const taxAmount = data.taxApplied ? dpp * 0.11 : 0;
  const grandTotal = dpp + taxAmount;
  const dp = Number(data.downPayment || 0);
  const isDPMode = data.invoiceType === 'DP';
  const total = isDPMode ? dp : (grandTotal - dp);

  return (
    <div id="print-area" style={{ width: '794px' }} className="flex flex-col items-center bg-transparent select-none">
      {pages.map((page, pageIndex) => {
        const startIdx = pages.slice(0, pageIndex).reduce((acc, p) => acc + p.items.length, 0);

        return (
          <div
            key={pageIndex}
            style={{
              width: '794px',
              height: '1123px',
              maxHeight: '1123px',
              minHeight: '1123px',
              backgroundColor: 'white',
              position: 'relative',
              fontFamily: 'Arial, sans-serif',
              color: '#000',
              boxSizing: 'border-box',
              overflow: 'hidden',
              marginBottom: isGeneratingPDF ? '0' : '20px',
              boxShadow: isGeneratingPDF ? 'none' : '0 25px 50px -12px rgb(0 0 0 / 0.25)'
            }}
            className={`a4-page flex flex-col ${pageIndex > 0 ? 'pdf-page-break' : ''}`}
          >
            {/* Kop Surat Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: pageIndex === 0 ? '25px 40px 15px 40px' : '20px 40px', borderBottom: '2px solid #1e3a8a' }}>
              <div style={{ flexShrink: 0 }}>
                {(() => {
                  const logoToDisplay = globalLogoUrl;
                  if (logoToDisplay && logoToDisplay !== "" && logoToDisplay !== "null" && logoToDisplay !== "undefined") {
                      return (
                          <img 
                            src={logoToDisplay} 
                            style={{ maxHeight: pageIndex === 0 ? '70px' : '40px', maxWidth: '140px', objectFit: 'contain' }} 
                            alt="Logo" 
                          />
                      );
                  }
                  return (
                      <div style={{ width: pageIndex === 0 ? '90px' : '45px', height: pageIndex === 0 ? '70px' : '40px', backgroundColor: '#1e3a8a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>AKL</div>
                  );
                })()}
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: pageIndex === 0 ? '24px' : '16px', fontWeight: '900', color: '#1e3a8a', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  PT. Apindo Karya Lestari
                </p>
                {pageIndex === 0 ? (
                  <>
                    <p style={{ margin: '0 0 6px 0', fontSize: '11px', fontWeight: 'bold', color: '#dc2626', letterSpacing: '3px', textTransform: 'uppercase' }}>
                      Spesialis Epoxy Lantai Sejak 1987
                    </p>
                    <p style={{ margin: '0 0 2px 0', fontSize: '11px', color: '#333' }}>
                      Jl. Raya Serpong KM.15 Ruko 17A, Tangerang Selatan
                    </p>
                    <p style={{ margin: '0', fontSize: '11px', color: '#333' }}>
                      Telp: (021) 5316 2972 | Email: apindokl@gmail.com
                    </p>
                  </>
                ) : (
                  <p style={{ margin: '0', fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>
                    Invoice: {data.invoiceNumber} — Hal {pageIndex + 1}
                  </p>
                )}
              </div>
            </div>

            {/* Dokumen Info (Hanya di Halaman Pertama) */}
            {page.isFirstPage && (
              <div style={{ padding: '30px 40px 15px 40px' }}>
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', letterSpacing: '4px', textDecoration: 'underline', color: '#0f172a' }}>
                    INVOICE / FAKTUR TAGIHAN
                  </h1>
                  {data.invoiceType === 'DP' && (
                     <p style={{ margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold', color: '#dc2626', letterSpacing: '1px' }}>
                       (TAGIHAN UANG MUKA)
                     </p>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Kiri: Kepada Yth */}
                  <div style={{ width: '55%', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '12px', backgroundColor: '#f8fafc' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '11px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Ditagihkan Kepada:</p>
                    <p style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>{data.companyName || '---'}</p>
                    {data.clientName && (
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', fontWeight: 'bold', color: '#334155' }}>U.P: {data.clientName}</p>
                    )}
                    <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>{data.clientAddress || '-'}</p>
                  </div>

                  {/* Kanan: Info Invoice */}
                  <div style={{ width: '40%' }}>
                    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '11px' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px', fontWeight: 'bold', width: '90px' }}>No. Invoice</td>
                          <td style={{ padding: '6px', fontWeight: '900', color: '#0f172a' }}>: {data.invoiceNumber}</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px', fontWeight: 'bold' }}>Tgl Terbit</td>
                          <td style={{ padding: '6px' }}>: {fmtDate(data.date)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '6px', fontWeight: 'bold' }}>Jatuh Tempo</td>
                          <td style={{ padding: '6px', fontWeight: 'bold', color: '#dc2626' }}>: {data.dueDate ? fmtDate(data.dueDate) : fmtDate(data.date)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tabel Item */}
            <div style={{ padding: page.isFirstPage ? '10px 40px 15px 40px' : '25px 40px 15px 40px', flexGrow: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #0f172a' }}>
                <thead style={{ backgroundColor: '#1e3a8a', color: 'white' }}>
                  <tr>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', width: '40px', textAlign: 'center' }}>NO</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', textAlign: 'left' }}>URAIAN PEKERJAAN & BAHAN</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', width: '50px', textAlign: 'center' }}>VOL</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', width: '60px', textAlign: 'center' }}>SATUAN</th>
                    <th style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', width: '90px', textAlign: 'right' }}>HARGA/SAT</th>
                    <th style={{ padding: '8px 10px', width: '100px', textAlign: 'right' }}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(page.items || []).map((item: any, idx: number) => {
                      const vol = Number(item.volume);
                      const price = Number(item.unitPrice) || 0;
                      const lineTotal = vol > 0 ? vol * price : price;

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', textAlign: 'center', verticalAlign: 'top' }}>
                            {startIdx + idx + 1}
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', textAlign: 'left', verticalAlign: 'top', whiteSpace: 'pre-wrap' }}>
                            {item.description}
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', textAlign: 'center', verticalAlign: 'top' }}>
                            {item.volume ? Number(item.volume).toLocaleString('id-ID') : '-'}
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', textAlign: 'center', verticalAlign: 'top' }}>
                            {item.satuan || '-'}
                          </td>
                          <td style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', textAlign: 'right', verticalAlign: 'top' }}>
                            {rp(price).replace('Rp', '')}
                          </td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', verticalAlign: 'top', fontWeight: 'bold' }}>
                            {rp(lineTotal).replace('Rp', '')}
                          </td>
                        </tr>
                      )
                  })}

                  {/* Summary Section at the bottom of the last page */}
                  {page.hasSummary && (
                    <>
                      <tr style={{ borderTop: '2px solid #0f172a' }}>
                        <td colSpan={4} rowSpan={isDPMode || dp > 0 || discountAmount > 0 || data.taxApplied ? 5 : 2} style={{ padding: '12px 15px', borderRight: '1px solid #0f172a', verticalAlign: 'top', backgroundColor: '#f8fafc' }}>
                           <div style={{ border: '1px solid #94a3b8', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
                               <p style={{ margin: '0 0 4px 0', fontSize: '9px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' }}>Terbilang Rupiah:</p>
                               <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', fontStyle: 'italic', lineHeight: '1.4' }}>
                                 ## {terbilang(total).toUpperCase()} ##
                               </p>
                           </div>
                        </td>
                        <td style={{ padding: '6px 10px', borderRight: '1px solid #0f172a', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>Subtotal</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>{rp(subtotal).replace('Rp', '')}</td>
                      </tr>
                      
                      {discountAmount > 0 && (
                        <tr>
                          <td style={{ padding: '6px 10px', borderRight: '1px solid #0f172a', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>Diskon</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#dc2626' }}>- {rp(discountAmount).replace('Rp', '')}</td>
                        </tr>
                      )}
                      
                      {data.taxApplied && (
                        <>
                          <tr>
                            <td style={{ padding: '6px 10px', borderRight: '1px solid #0f172a', textAlign: 'right', fontWeight: 'bold' }}>DPP</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold' }}>{rp(dpp).replace('Rp', '')}</td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px 10px', borderRight: '1px solid #0f172a', textAlign: 'right', fontWeight: 'bold' }}>PPN 11%</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold' }}>{rp(taxAmount).replace('Rp', '')}</td>
                          </tr>
                        </>
                      )}

                      {dp > 0 && !isDPMode && (
                        <tr>
                          <td style={{ padding: '6px 10px', borderRight: '1px solid #0f172a', textAlign: 'right', fontWeight: 'bold', color: '#d97706' }}>DP Dibayar</td>
                          <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 'bold', color: '#d97706' }}>- {rp(dp).replace('Rp', '')}</td>
                        </tr>
                      )}

                      <tr>
                        <td style={{ padding: '8px 10px', borderRight: '1px solid #0f172a', textAlign: 'right', fontWeight: '900', backgroundColor: '#1e3a8a', color: 'white', fontSize: '12px' }}>
                          {isDPMode ? 'TOTAL DP' : (dp > 0 ? 'SISA TAGIHAN' : 'GRAND TOTAL')}
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '900', backgroundColor: '#1e3a8a', color: 'white', fontSize: '12px' }}>
                          {rp(total)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer: Rekening & Tanda Tangan */}
            {page.showFooter && (
              <div style={{ padding: '10px 40px 30px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ width: '60%' }}>
                  <p style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 'bold', textDecoration: 'underline' }}>PEMBAYARAN DITRANSFER KE REKENING:</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ border: '2px solid #0f172a', padding: '10px 15px', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                      <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '900' }}>PT. APINDO KARYA LESTARI</p>
                      <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: 'bold' }}>Bank Danamon BSD</p>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', letterSpacing: '1px' }}>A/C: 35-75-125-798</p>
                    </div>
                  </div>
                </div>

                <div style={{ width: '30%', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '11px', color: '#0f172a' }}>
                    Tangerang Selatan, {fmtDate(data.date)}
                  </p>
                  
                  {/* Area Kosong untuk Materai dan TTD Basah */}
                  <div style={{ height: '120px', width: '100%', position: 'relative' }}>
                    {/* Placeholder Panduan Materai (Bisa dihapus jika tidak mau terlihat saat print, 
                        tapi karena ini preview, biarkan transparan) */}
                    <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '40px', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                        <span style={{ fontSize: '8px', color: '#94a3b8' }}>Materai</span>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '900', textDecoration: 'underline', color: '#0f172a', textTransform: 'uppercase' }}>
                    MUDINI NURAFIN
                  </p>
                </div>
              </div>
            )}

            {/* Bottom accent */}
            <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '8px', backgroundColor: '#1e3a8a' }} />
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(InvoiceA4Preview);
