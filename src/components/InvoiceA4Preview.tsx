"use client";

import React from "react";
import { InvoiceData } from "@/lib/types";

interface Props {
  data: InvoiceData;
  isGeneratingPDF: boolean;
  globalLogoUrl?: string | null;
  globalTTDUrl?: string | null;
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

// ─── Currency formatter ───────────────────────────────────────────────────────
const rp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(n).replace('IDR', 'Rp').replace('Rp', 'Rp ').replace(/\s+/, ' ');

// ─── Date formatter ───────────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

const fmtDateLong = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

// ─── Style helpers ────────────────────────────────────────────────────────────
const cell: React.CSSProperties = {
  border: '1px solid #333',
  padding: '5px 8px',
  fontSize: '11px',
};

export default function InvoiceA4Preview({ data, isGeneratingPDF, globalLogoUrl, globalTTDUrl }: Props) {
  // Financial calculations
  const subtotal = data.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0);
  const discountAmount = Number(data.discountAmount || 0);
  const dpp = subtotal - discountAmount;
  const taxAmount = data.taxApplied ? dpp * 0.11 : 0;
  const grandTotal = dpp + taxAmount;
  const dp = Number(data.downPayment || 0);
  const isDPMode = data.invoiceType === 'DP';
  const total = isDPMode ? dp : (grandTotal - dp);
  const totalLabel = total;

  // Build "Untuk Pembayaran" description from items
  const paymentDesc = data.notes
    ? data.notes
    : data.items.map(i => i.description).filter(Boolean).join('; ');

  // Build per-item calc lines
  const itemLines = data.items.map(i => ({
    desc: i.description,
    qty: i.quantity,
    price: i.unitPrice,
    lineTotal: i.quantity * i.unitPrice,
  }));

  return (
    <div
      style={{
        width: '794px',
        minHeight: '1123px',
        backgroundColor: 'white',
        position: 'relative',
        fontFamily: 'Arial, sans-serif',
        color: '#000',
        boxSizing: 'border-box',
        overflow: isGeneratingPDF ? 'visible' : 'hidden',
      }}
      className="a4-page"
    >
      {/* ── TOP HEADER ───────────────────────────────────────────────────── */}
      {/* Thin blue top bar */}
      <div style={{ height: '8px', backgroundColor: '#1e3a8a', width: '100%' }} />

      {/* Main header row: logo left, company info right */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 30px 10px 30px' }}>
        {/* Left: Logo */}
        <div style={{ flexShrink: 0 }}>
          {globalLogoUrl ? (
            <img src={globalLogoUrl} style={{ maxHeight: '80px', maxWidth: '130px', objectFit: 'contain' }} alt="Logo" />
          ) : (
            /* Fallback: drawn house logo */
            <div style={{ width: '90px', height: '80px', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* House roof */}
              <div style={{
                width: 0, height: 0,
                borderLeft: '45px solid transparent',
                borderRight: '45px solid transparent',
                borderBottom: '32px solid #1e3a8a',
                marginBottom: '-1px',
              }} />
              {/* House body */}
              <div style={{
                width: '78px', height: '40px',
                backgroundColor: '#1e3a8a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                {/* Red square inside */}
                <div style={{
                  width: '38px', height: '34px',
                  backgroundColor: '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: 'white', letterSpacing: '-1px' }}>AKL</span>
                </div>
              </div>
              {/* Sub label */}
              <p style={{ margin: '3px 0 0', fontSize: '6px', color: '#1e3a8a', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.3px', whiteSpace: 'nowrap' }}>
                PT. APINDO KARYA LESTARI
              </p>
            </div>
          )}
        </div>

        {/* Right: Company name + tagline + address */}
        <div style={{ textAlign: 'right' }}>
          <p style={{ margin: '0 0 2px 0', fontSize: '22px', fontWeight: '900', color: '#1e3a8a', letterSpacing: '1px', textTransform: 'uppercase' }}>
            PT. Apindo Karya Lestari
          </p>
          <p style={{ margin: '0 0 6px 0', fontSize: '10px', fontWeight: 'bold', color: '#1e3a8a', letterSpacing: '3px', textTransform: 'uppercase' }}>
            Spesialis Epoxy Lantai Sejak 1987
          </p>
          <p style={{ margin: '0', fontSize: '10px', color: '#333' }}>
            Jl. Raya Serpong KM.15 Ruko 17A, Tangerang Selatan
          </p>
          <p style={{ margin: '0', fontSize: '10px', color: '#333' }}>
            Telp: (021) 5316 2972 | Email: apindokl@gmail.com | Web: www.apindokl.co.id
          </p>
        </div>
      </div>

      {/* Double rule: thick blue + thin red */}
      <div style={{ height: '4px', backgroundColor: '#1e3a8a', width: '100%' }} />
      <div style={{ height: '2px', backgroundColor: '#dc2626', width: '100%', marginBottom: '0' }} />

      {/* ── KWITANSI TITLE + NUMBER/DATE ────────────────────────────────── */}
      <div style={{ display: 'flex', padding: '20px 30px 15px 30px', alignItems: 'flex-start' }}>
        {/* Title - center */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: '900', letterSpacing: '4px', textDecoration: 'underline', color: '#1e3a8a' }}>
            KWITANSI
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', fontStyle: 'italic', color: '#555', letterSpacing: '2px', backgroundColor: '#f1f5f9', padding: '2px 10px', borderRadius: '4px' }}>
            RECEIPT
          </p>
        </div>
        {/* No / Date / Due Date */}
        <div style={{ width: '260px', fontSize: '11px' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #cbd5e1' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '4px 8px', fontWeight: 'bold', whiteSpace: 'nowrap', backgroundColor: '#f8fafc', width: '80px' }}>No</td>
                <td style={{ padding: '4px 8px' }}>: <span style={{ fontWeight: 'bold', color: '#dc2626' }}>{data.invoiceNumber}</span></td>
              </tr>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '4px 8px', fontWeight: 'bold', whiteSpace: 'nowrap', backgroundColor: '#f8fafc' }}>Tgl <span style={{ fontStyle: 'italic', color: '#94a3b8', fontSize: '9px', fontWeight: 'normal' }}>(Date)</span></td>
                <td style={{ padding: '4px 8px' }}>: {fmtDate(data.date)}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px 8px', fontWeight: 'bold', whiteSpace: 'nowrap', backgroundColor: '#f8fafc' }}>Jatuh Tempo</td>
                <td style={{ padding: '4px 8px' }}>: {data.dueDate ? fmtDate(data.dueDate) : fmtDate(data.date)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ margin: '0 20px', borderTop: '1px solid #333' }} />

      {/* ── BODY FIELDS ─────────────────────────────────────────────────── */}
      <div style={{ padding: '15px 30px', fontSize: '13px' }}>
        {/* Sudah Terima Dari */}
        <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ verticalAlign: 'top' }}>
              <td style={{ width: '170px', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Sudah Terima Dari</span><br />
                <span style={{ fontStyle: 'italic', fontSize: '10px', color: '#64748b' }}>Received From</span>
              </td>
              <td style={{ width: '20px', fontWeight: 'bold', paddingTop: '6px' }}>:</td>
              <td style={{ borderBottom: '1px dotted #94a3b8', padding: '6px 10px', fontWeight: '900', fontSize: '13px', backgroundColor: '#f8fafc' }}>
                {data.companyName || data.clientName || '---'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Banyaknya */}
        <table style={{ width: '100%', marginBottom: '12px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ verticalAlign: 'top' }}>
              <td style={{ width: '170px', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Banyaknya Uang</span><br />
                <span style={{ fontStyle: 'italic', fontSize: '10px', color: '#64748b' }}>The Amount Of</span>
              </td>
              <td style={{ width: '20px', fontWeight: 'bold', paddingTop: '6px' }}>:</td>
              <td style={{ borderBottom: '1px dotted #94a3b8', padding: '6px 10px', fontWeight: 'bold', fontStyle: 'italic', fontSize: '12px', backgroundColor: '#f8fafc', lineHeight: '1.6' }}>
                ## {terbilang(totalLabel)} ##
              </td>
            </tr>
          </tbody>
        </table>

        {/* Untuk Pembayaran */}
        <table style={{ width: '100%', marginBottom: '5px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ verticalAlign: 'top' }}>
              <td style={{ width: '170px', paddingTop: '6px' }}>
                <span style={{ fontWeight: 'bold' }}>Untuk Pembayaran</span><br />
                <span style={{ fontStyle: 'italic', fontSize: '10px', color: '#64748b' }}>For Payment Of</span>
              </td>
              <td style={{ width: '20px', fontWeight: 'bold', paddingTop: '6px' }}>:</td>
              <td style={{ borderBottom: '1px dotted #94a3b8', padding: '6px 10px', fontWeight: '600', fontSize: '12px', backgroundColor: '#f8fafc', lineHeight: '1.6' }}>
                {paymentDesc || '-'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ margin: '0 20px', borderTop: '1px solid #333' }} />

      {/* ── CALCULATION TABLE ────────────────────────────────────────────── */}
      <div style={{ padding: '5px 30px 15px 30px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginLeft: 'auto', marginRight: '0', fontSize: '11px', border: '1px solid #e2e8f0' }}>
          <thead style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
            <tr>
              <td style={{ padding: '6px 12px', fontWeight: 'bold' }}>Deskripsi</td>
              <td colSpan={2} style={{ padding: '6px 12px', fontWeight: 'bold', textAlign: 'right' }}>Jumlah</td>
            </tr>
          </thead>
          <tbody>
            {/* Item lines */}
            {itemLines.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '5px 12px', textAlign: 'left', width: '60%' }}>
                  {item.desc}
                </td>
                <td style={{ padding: '5px 12px', textAlign: 'right', width: '10%' }}>Rp</td>
                <td style={{ padding: '5px 12px', textAlign: 'right', width: '20%', minWidth: '100px' }}>
                  {rp(item.lineTotal).replace('Rp ', '')}
                </td>
              </tr>
            ))}

            {/* Jumlah */}
            <tr style={{ borderTop: '1px solid #cbd5e1' }}>
              <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>Subtotal =</td>
              <td style={{ padding: '5px 12px', textAlign: 'right' }}>Rp</td>
              <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>{rp(subtotal).replace('Rp ', '')}</td>
            </tr>

            {/* Diskon */}
            {discountAmount > 0 && (
              <tr>
                <td style={{ padding: '5px 12px', textAlign: 'right', color: '#dc2626' }}>Diskon =</td>
                <td style={{ padding: '5px 12px', textAlign: 'right', color: '#dc2626' }}>- Rp</td>
                <td style={{ padding: '5px 12px', textAlign: 'right', color: '#dc2626' }}>{rp(discountAmount).replace('Rp ', '')}</td>
              </tr>
            )}

            {/* DPP */}
            {data.taxApplied && (
              <tr>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>DPP =</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>Rp</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>{rp(dpp).replace('Rp ', '')}</td>
              </tr>
            )}

            {/* PPN */}
            {data.taxApplied && (
              <tr>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>PPN 11% =</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>Rp</td>
                <td style={{ padding: '5px 12px', textAlign: 'right' }}>{rp(taxAmount).replace('Rp ', '')}</td>
              </tr>
            )}

            {/* Grand Total Proyek */}
            {(data.taxApplied || discountAmount > 0) && dp > 0 && (
              <tr style={{ borderTop: '1px solid #e2e8f0' }}>
                <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>Total Nilai Proyek =</td>
                <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>Rp</td>
                <td style={{ padding: '5px 12px', textAlign: 'right', fontWeight: 'bold' }}>{rp(grandTotal).replace('Rp ', '')}</td>
              </tr>
            )}

            {/* DP sebagai pengurang (hanya untuk mode Pelunasan) */}
            {!isDPMode && dp > 0 && (
              <tr>
                <td style={{ padding: '5px 12px', textAlign: 'right', color: '#16a34a' }}>Uang Muka yang Sudah Dibayar =</td>
                <td style={{ padding: '5px 12px', textAlign: 'right', color: '#16a34a' }}>- Rp</td>
                <td style={{ padding: '5px 12px', textAlign: 'right', color: '#16a34a' }}>{rp(dp).replace('Rp ', '')}</td>
              </tr>
            )}

            {/* Sisa / Total Tagihan */}
            <tr>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '900', fontSize: '12px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
                {isDPMode ? 'Tagihan Uang Muka (DP) =' : (dp > 0 ? 'Sisa Tagihan =' : 'Total Tagihan =')}
              </td>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '900', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>Rp</td>
              <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: '900', fontSize: '12px', backgroundColor: '#f8fafc', borderTop: '1px solid #cbd5e1' }}>
                {rp(total).replace('Rp ', '')}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ margin: '0 30px', borderTop: '2px solid #e2e8f0' }} />

      {/* ── LOWER SECTION: TOTAL + BANK + SIGNATURE ──────────────────────── */}
      <div style={{ padding: '18px 30px 24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>

        {/* Left column: Total + Payment Method + Bank */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* LARGE TOTAL */}
          <div style={{ marginBottom: '14px' }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '9px', fontWeight: '700', color: '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Jumlah Tagihan</p>
            <p style={{ margin: 0, fontSize: '26px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px', lineHeight: 1 }}>
              {rp(total)}
            </p>
          </div>

          {/* PAYMENT METHOD row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
            <p style={{ margin: 0, fontSize: '9px', fontWeight: '700', color: '#64748b', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Via:</p>
            {(['CASH', 'CHEQUE', 'BILYET GIRO', 'TRANSFER'] as const).map(method => (
              <div key={method} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '14px', height: '14px',
                  border: data.paymentMethod === method ? '2px solid #1e3a8a' : '1.5px solid #94a3b8',
                  borderRadius: '2px',
                  backgroundColor: data.paymentMethod === method ? '#1e3a8a' : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: '9px', fontWeight: 'bold', flexShrink: 0
                }}>
                  {data.paymentMethod === method && "✓"}
                </div>
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: data.paymentMethod === method ? '#1e3a8a' : '#64748b', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{method}</span>
              </div>
            ))}
          </div>

          {/* BANK INFO CARD */}
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '12px',
          }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '9px', fontWeight: '800', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Rekening Pembayaran
            </p>
            <div style={{ display: 'flex', alignItems: 'stretch', gap: '0' }}>
              {/* Blue accent bar */}
              <div style={{ width: '4px', backgroundColor: '#1e3a8a', borderRadius: '4px 0 0 4px', flexShrink: 0 }} />
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '0 6px 6px 0', border: '1px solid #e2e8f0', borderLeft: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', width: '110px', flexShrink: 0 }}>Bank</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>Bank Danamon — Cabang BSD I</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', width: '110px', flexShrink: 0 }}>No. Rekening</span>
                  <span style={{ fontSize: '15px', fontWeight: '900', color: '#1e3a8a', letterSpacing: '1.5px', fontVariantNumeric: 'tabular-nums' }}>35-75-125-798</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', width: '110px', flexShrink: 0 }}>Atas Nama</span>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a' }}>PT. Apindo Karya Lestari</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Signature block */}
        <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '10px', color: '#475569', textAlign: 'center', fontStyle: 'italic' }}>
            Tangerang, {fmtDateLong(data.date)}
          </p>
          <p style={{ margin: '0 0 4px 0', fontSize: '9px', fontWeight: '700', color: '#94a3b8', letterSpacing: '1.5px', textTransform: 'uppercase', textAlign: 'center' }}>
            Hormat Kami,
          </p>

          {/* TTD area: fixed height box */}
          <div style={{ width: '170px', height: '75px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {globalTTDUrl && (
              <img src={globalTTDUrl} style={{ maxWidth: '160px', maxHeight: '75px', objectFit: 'contain', position: 'absolute' }} alt="Tanda Tangan" />
            )}
          </div>

          {/* Signature line */}
          <div style={{ borderTop: '1.5px solid #334155', width: '160px', textAlign: 'center', paddingTop: '6px' }}>
            <p style={{ margin: 0, fontSize: '11px', fontWeight: '900', color: '#0f172a', letterSpacing: '0.3px' }}>
              Mudini Nurafin
            </p>
          </div>
        </div>
      </div>

      {/* ── FOOTER: thin blue bar only (address already in header) ─────── */}
      <div style={{
        position: 'absolute', bottom: '0', left: '0', width: '100%',
        height: '8px', backgroundColor: '#1e3a8a',
      }} />
    </div>
  );
}
