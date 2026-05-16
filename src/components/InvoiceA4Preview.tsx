"use client";

import React, { useMemo } from "react";
import { calculatePages } from "@/lib/paginator";

interface InvoiceA4PreviewProps {
    data: any;
    isGeneratingPDF: boolean;
    globalLogoUrl?: string | null;
}

// ─── Terbilang ───────────────────────────────────────────────────────────────
const SAT = ['','Satu','Dua','Tiga','Empat','Lima','Enam','Tujuh','Delapan','Sembilan','Sepuluh','Sebelas','Dua Belas','Tiga Belas','Empat Belas','Lima Belas','Enam Belas','Tujuh Belas','Delapan Belas','Sembilan Belas'];
const PUL = ['','','Dua Puluh','Tiga Puluh','Empat Puluh','Lima Puluh','Enam Puluh','Tujuh Puluh','Delapan Puluh','Sembilan Puluh'];
function tbGroup(n: number): string {
  if (n===0) return '';
  if (n<20) return SAT[n];
  if (n<100) return PUL[Math.floor(n/10)]+(n%10?' '+SAT[n%10]:'');
  const h=Math.floor(n/100), r=n%100;
  return (h===1?'Seratus':SAT[h]+' Ratus')+(r?' '+tbGroup(r):'');
}
function terbilang(n: number): string {
  n=Math.round(Math.abs(n));
  if (n===0) return 'Nol Rupiah';
  const t=Math.floor(n);
  const tri=Math.floor(t/1_000_000_000_000);
  const mil=Math.floor((t%1_000_000_000_000)/1_000_000_000);
  const jut=Math.floor((t%1_000_000_000)/1_000_000);
  const rb=Math.floor((t%1_000_000)/1_000);
  const sis=t%1_000;
  let r='';
  if(tri) r+=tbGroup(tri)+' Triliun ';
  if(mil) r+=tbGroup(mil)+' Miliar ';
  if(jut) r+=tbGroup(jut)+' Juta ';
  if(rb) r+=(rb===1?'Seribu':tbGroup(rb)+' Ribu')+' ';
  if(sis) r+=tbGroup(sis);
  return r.trim()+' Rupiah';
}

// ─── Formatter ───────────────────────────────────────────────────────────────
const rp = (n: number) =>
  new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0})
    .format(n).replace('IDR','Rp').replace('Rp','Rp ').replace(/\s+/,' ');

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'});

// ─── Warna Korporat ──────────────────────────────────────────────────────────
const BLUE  = '#1e3a8a';
const RED   = '#dc2626';
const LIGHT = '#f8fafc';

const InvoiceA4Preview = ({ data, isGeneratingPDF, globalLogoUrl }: InvoiceA4PreviewProps) => {
  const pages = useMemo(() => calculatePages(data), [data]);

  const subtotal = (data.items||[]).reduce((acc:number,i:any)=>{
    const vol=Number(i.volume), price=Number(i.unitPrice)||0;
    return acc+(vol>0?vol*price:price);
  },0);
  const disc  = Number(data.discountAmount||0);
  const dpp   = subtotal-disc;
  const taxAmt= data.taxApplied?dpp*0.11:0;
  const grand = dpp+taxAmt;
  const dp    = Number(data.downPayment||0);
  const isDPMode = data.invoiceType==='DP';
  const total = isDPMode?dp:(grand-dp);

  return (
    <div id="print-area" style={{width:'794px'}} className="flex flex-col items-center bg-transparent select-none">
      {pages.map((page,pi)=>{
        const startIdx=pages.slice(0,pi).reduce((a,p)=>a+p.items.length,0);
        return (
          <div key={pi}
            style={{
              width:'794px', height:'1123px', maxHeight:'1123px', minHeight:'1123px',
              backgroundColor:'white', position:'relative', fontFamily:'Arial, sans-serif',
              color:'#000', boxSizing:'border-box', overflow:'hidden',
              marginBottom:isGeneratingPDF?'0':'20px',
              boxShadow:isGeneratingPDF?'none':'0 25px 50px -12px rgb(0 0 0 / 0.25)'
            }}
            className={`a4-page flex flex-col ${pi>0?'pdf-page-break':''}`}
          >
            {/* ═══ LIS BIRU ATAS ═══ */}
            <div style={{width:'100%',height:'15px',backgroundColor:BLUE,flexShrink:0}}/>

            {/* ═══ HEADER KOP SURAT ═══ */}
            <div style={{padding:'15px 40px 0 40px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              {/* Logo */}
              <div style={{width:'120px',display:'flex',alignItems:'center',justifyContent:'flex-start'}}>
                {(()=>{
                  const logo=globalLogoUrl;
                  if(logo&&logo!==''&&logo!=='null'&&logo!=='undefined')
                    return <img src={logo} style={{maxHeight:pi===0?'80px':'40px',maxWidth:'110px',objectFit:'contain'}} alt="Logo"/>;
                  return <div style={{width:pi===0?'80px':'40px',height:pi===0?'80px':'40px',background:'#f1f5f9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',color:'#94a3b8',fontWeight:'bold'}}>LOGO</div>;
                })()}
              </div>

              {/* Identitas Perusahaan */}
              <div style={{textAlign:'right'}}>
                <h1 style={{fontSize:pi===0?'22px':'14px',fontWeight:'900',color:BLUE,margin:'0 0 2px 0',letterSpacing:'-0.5px',textTransform:'uppercase'}}>
                  PT. Apindo Karya Lestari
                </h1>
                {pi===0?(
                  <>
                    <p style={{fontSize:'10px',fontWeight:'bold',color:'#64748b',margin:'0 0 4px 0',letterSpacing:'2px',textTransform:'uppercase'}}>
                      Spesialis Epoxy Lantai Sejak 1987
                    </p>
                    <p style={{fontSize:'10px',color:'#334155',margin:'0'}}>Jl. Raya Serpong KM.15 Ruko 17A, Tangerang Selatan</p>
                    <p style={{fontSize:'10px',color:'#334155',margin:'0'}}>Telp: (021) 5316 2972 | Email: apindokl@gmail.com</p>
                  </>
                ):(
                  <p style={{fontSize:'9px',fontWeight:'bold',color:'#64748b',margin:'0',textTransform:'uppercase'}}>
                    Invoice: {data.invoiceNumber} — Hal {pi+1}
                  </p>
                )}
              </div>
            </div>

            {/* Garis Biru Tebal + Garis Merah (sama persis seperti Penawaran) */}
            <div style={{margin:pi===0?'8px 40px 2px 40px':'4px 40px 2px 40px',borderBottom:'3px solid '+BLUE}}/>
            <div style={{margin:'0 40px 10px 40px',borderBottom:'1px solid '+RED}}/>

            {/* ═══ INFO DOKUMEN (Halaman Pertama) ═══ */}
            {page.isFirstPage&&(
              <div style={{padding:'0 40px 10px 40px'}}>
                {/* Judul Tengah */}
                <div style={{textAlign:'center',marginBottom:'12px'}}>
                  <h1 style={{margin:0,fontSize:'18px',fontWeight:'900',letterSpacing:'4px',textDecoration:'underline',color:'#0f172a',textTransform:'uppercase'}}>
                    Invoice / Faktur Tagihan
                  </h1>
                  {data.invoiceType==='DP'&&(
                    <p style={{margin:'4px 0 0 0',fontSize:'11px',fontWeight:'bold',color:RED,letterSpacing:'1px'}}>
                      (TAGIHAN UANG MUKA / DOWN PAYMENT)
                    </p>
                  )}
                </div>

                {/* Panel Klien + Info Dokumen */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'20px'}}>
                  {/* Kiri: Ditagihkan Kepada */}
                  <div style={{flex:'1',border:'1px solid #cbd5e1',borderLeft:'5px solid '+BLUE,borderRadius:'4px',padding:'12px 14px',backgroundColor:LIGHT}}>
                    <p style={{margin:'0 0 6px 0',fontSize:'9px',fontWeight:'bold',color:'#64748b',textTransform:'uppercase',letterSpacing:'2px'}}>Ditagihkan Kepada:</p>
                    <p style={{margin:'0 0 3px 0',fontSize:'15px',fontWeight:'900',color:'#0f172a',textTransform:'uppercase'}}>{data.companyName||'---'}</p>
                    {data.clientName&&<p style={{margin:'0 0 6px 0',fontSize:'11px',fontWeight:'bold',color:'#334155'}}>U.P: {data.clientName}</p>}
                    <p style={{margin:0,fontSize:'11px',color:'#475569',lineHeight:'1.5'}}>{data.clientAddress||'-'}</p>
                  </div>

                  {/* Kanan: Detail Invoice */}
                  <div style={{width:'220px',border:'1px solid #cbd5e1',borderRadius:'4px',overflow:'hidden'}}>
                    <div style={{backgroundColor:BLUE,padding:'6px 10px'}}>
                      <p style={{margin:0,fontSize:'10px',fontWeight:'900',color:'white',textTransform:'uppercase',letterSpacing:'2px'}}>Detail Invoice</p>
                    </div>
                    <table style={{borderCollapse:'collapse',width:'100%',fontSize:'11px'}}>
                      <tbody>
                        <tr style={{borderBottom:'1px solid #e2e8f0'}}>
                          <td style={{padding:'7px 10px',fontWeight:'bold',color:'#64748b',width:'90px',fontSize:'10px'}}>No. Invoice</td>
                          <td style={{padding:'7px 10px',fontWeight:'900',color:'#0f172a',fontSize:'10px'}}>: {data.invoiceNumber}</td>
                        </tr>
                        <tr style={{borderBottom:'1px solid #e2e8f0',backgroundColor:LIGHT}}>
                          <td style={{padding:'7px 10px',fontWeight:'bold',color:'#64748b',fontSize:'10px'}}>Tgl Terbit</td>
                          <td style={{padding:'7px 10px',fontSize:'10px'}}>: {fmtDate(data.date)}</td>
                        </tr>
                        <tr>
                          <td style={{padding:'7px 10px',fontWeight:'bold',color:RED,fontSize:'10px'}}>Jatuh Tempo</td>
                          <td style={{padding:'7px 10px',fontWeight:'bold',color:RED,fontSize:'10px'}}>: {data.dueDate?fmtDate(data.dueDate):fmtDate(data.date)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ═══ TABEL ITEM ═══ */}
            <div style={{padding:page.isFirstPage?'8px 40px 10px 40px':'0 40px 10px 40px',flexGrow:1}}>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'11px',border:'1px solid #cbd5e1',tableLayout:'fixed'}}>
                <thead style={{backgroundColor:BLUE,color:'white'}}>
                  <tr>
                    <th style={{padding:'7px 8px',border:'1px solid #cbd5e1',width:'36px',textAlign:'center',fontSize:'10px'}}>NO</th>
                    <th style={{padding:'7px 8px',border:'1px solid #cbd5e1',textAlign:'left',fontSize:'10px'}}>URAIAN PEKERJAAN &amp; BAHAN</th>
                    <th style={{padding:'7px 8px',border:'1px solid #cbd5e1',width:'52px',textAlign:'center',fontSize:'10px'}}>VOL</th>
                    <th style={{padding:'7px 8px',border:'1px solid #cbd5e1',width:'58px',textAlign:'center',fontSize:'10px'}}>SATUAN</th>
                    <th style={{padding:'7px 8px',border:'1px solid #cbd5e1',width:'95px',textAlign:'right',fontSize:'10px'}}>HARGA/SAT</th>
                    <th style={{padding:'7px 8px',border:'1px solid #cbd5e1',width:'105px',textAlign:'right',fontSize:'10px'}}>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(page.items||[]).map((item:any,idx:number)=>{
                    const vol=Number(item.volume), price=Number(item.unitPrice)||0;
                    const lineTotal=vol>0?vol*price:price;
                    const rowBg=(startIdx+idx)%2===0?'#ffffff':LIGHT;
                    return (
                      <tr key={idx} style={{backgroundColor:rowBg,borderBottom:'1px solid #e2e8f0'}}>
                        <td style={{padding:'7px 8px',border:'1px solid #cbd5e1',textAlign:'center',verticalAlign:'top'}}>{startIdx+idx+1}</td>
                        <td style={{padding:'7px 8px',border:'1px solid #cbd5e1',verticalAlign:'top',whiteSpace:'pre-wrap'}}>{item.description}</td>
                        <td style={{padding:'7px 8px',border:'1px solid #cbd5e1',textAlign:'center',verticalAlign:'top'}}>{item.volume?Number(item.volume).toLocaleString('id-ID'):'-'}</td>
                        <td style={{padding:'7px 8px',border:'1px solid #cbd5e1',textAlign:'center',verticalAlign:'top',color:'#475569',fontWeight:'bold'}}>{item.satuan||'-'}</td>
                        <td style={{padding:'7px 8px',border:'1px solid #cbd5e1',textAlign:'right',verticalAlign:'top'}}>{rp(price).replace('Rp ','')}</td>
                        <td style={{padding:'7px 8px',border:'1px solid #cbd5e1',textAlign:'right',verticalAlign:'top',fontWeight:'bold',color:BLUE}}>{rp(lineTotal).replace('Rp ','')}</td>
                      </tr>
                    );
                  })}

                  {/* ── RINGKASAN TOTAL ── */}
                  {page.hasSummary&&(
                    <>
                      <tr><td colSpan={6} style={{height:'4px',border:'none'}}></td></tr>

                      {/* Subtotal */}
                      <tr style={{backgroundColor:LIGHT}}>
                        <td colSpan={4} rowSpan={disc>0&&data.taxApplied?5:disc>0||data.taxApplied?4:3}
                          style={{padding:'12px',border:'1px solid #cbd5e1',verticalAlign:'top'}}>
                          <div style={{border:'1px solid #94a3b8',padding:'10px 12px',backgroundColor:'white',borderRadius:'4px',borderLeft:'4px solid '+BLUE}}>
                            <p style={{margin:'0 0 5px 0',fontSize:'9px',fontWeight:'bold',color:'#64748b',textTransform:'uppercase',letterSpacing:'1px'}}>Terbilang:</p>
                            <p style={{margin:0,fontSize:'11px',fontWeight:'900',fontStyle:'italic',lineHeight:'1.5',color:'#0f172a'}}>
                              ## {terbilang(total).toUpperCase()} ##
                            </p>
                          </div>
                        </td>
                        <td style={{padding:'7px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold',color:'#64748b',fontSize:'10px',textTransform:'uppercase'}}>Sub Total</td>
                        <td style={{padding:'7px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold'}}>{rp(subtotal).replace('Rp ','')}</td>
                      </tr>

                      {disc>0&&(
                        <tr>
                          <td style={{padding:'6px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold',color:RED,fontSize:'10px',textTransform:'uppercase'}}>Diskon</td>
                          <td style={{padding:'6px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold',color:RED}}>- {rp(disc).replace('Rp ','')}</td>
                        </tr>
                      )}

                      {data.taxApplied&&(
                        <>
                          <tr style={{backgroundColor:LIGHT}}>
                            <td style={{padding:'6px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold',color:'#64748b',fontSize:'10px',textTransform:'uppercase'}}>DPP</td>
                            <td style={{padding:'6px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold'}}>{rp(dpp).replace('Rp ','')}</td>
                          </tr>
                          <tr>
                            <td style={{padding:'6px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold',color:'#64748b',fontSize:'10px',textTransform:'uppercase'}}>PPN 11%</td>
                            <td style={{padding:'6px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold'}}>{rp(taxAmt).replace('Rp ','')}</td>
                          </tr>
                        </>
                      )}

                      {dp>0&&!isDPMode&&(
                        <tr>
                          <td style={{padding:'6px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold',color:'#d97706',fontSize:'10px',textTransform:'uppercase'}}>DP Dibayar</td>
                          <td style={{padding:'6px 10px',border:'1px solid #cbd5e1',textAlign:'right',fontWeight:'bold',color:'#d97706'}}>- {rp(dp).replace('Rp ','')}</td>
                        </tr>
                      )}

                      {/* Grand Total */}
                      <tr style={{backgroundColor:BLUE,color:'white'}}>
                        <td colSpan={5} style={{padding:'10px 12px',border:'1px solid '+BLUE,textAlign:'right',fontWeight:'900',textTransform:'uppercase',fontSize:'11px',letterSpacing:'1px'}}>
                          {isDPMode?'Total Tagihan DP':(dp>0?'Sisa Tagihan':'Grand Total')}
                        </td>
                        <td style={{padding:'10px 12px',border:'1px solid '+BLUE,textAlign:'right',fontWeight:'900',fontSize:'13px',borderLeft:'1px solid rgba(255,255,255,0.2)'}}>
                          {rp(total)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* ═══ FOOTER: Rekening & TTD ═══ */}
            {page.showFooter&&(
              <div style={{padding:'6px 40px 55px 40px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                {/* Rekening */}
                <div style={{width:'55%',paddingRight:'15px'}}>
                  <div style={{border:'1px solid #cbd5e1',borderLeft:'5px solid '+BLUE,borderRadius:'4px',padding:'12px',backgroundColor:LIGHT}}>
                    <p style={{margin:'0 0 4px 0',fontWeight:'bold',color:BLUE,fontSize:'9px',textTransform:'uppercase',letterSpacing:'1px'}}>Pembayaran Ditransfer Ke:</p>
                    <p style={{margin:'0 0 2px 0',fontWeight:'900',fontSize:'16px'}}>35 - 75 - 125 - 798</p>
                    <p style={{fontSize:'9px',fontWeight:'bold',color:'#475569',margin:'0'}}>Bank Danamon BSD | A.N PT. APINDO KARYA LESTARI</p>
                  </div>
                </div>

                {/* Tanda Tangan */}
                <div style={{width:'40%',textAlign:'center'}}>
                  <p style={{margin:'0 0 4px 0',fontSize:'11px',color:'#0f172a'}}>
                    Tangerang Selatan, {fmtDate(data.date)}
                  </p>
                  <p style={{margin:'0 0 8px 0',fontSize:'11px',fontWeight:'bold',color:'#0f172a'}}>
                    PT. APINDO KARYA LESTARI
                  </p>
                  {/* Ruang materai + TTD basah */}
                  <div style={{height:'120px',width:'100%',position:'relative'}}>
                    <div style={{position:'absolute',bottom:'8px',left:'50%',transform:'translateX(-50%)',width:'65px',height:'43px',border:'1px dashed #cbd5e1',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <span style={{fontSize:'7px',color:'#94a3b8'}}>Materai</span>
                    </div>
                  </div>
                  <p style={{margin:'0',fontSize:'13px',fontWeight:'900',textDecoration:'underline',color:'#0f172a',textTransform:'uppercase'}}>
                    MUDINI NURAFIN
                  </p>
                </div>
              </div>
            )}

            {/* ═══ FOOTER BAR BIRU BAWAH ═══ */}
            <div style={{position:'absolute',bottom:'0',left:'0',width:'100%',height:'35px',backgroundColor:'#1e3b8b',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 40px',boxSizing:'border-box'}}>
              <p style={{margin:0,fontSize:'8px',fontWeight:'900',color:'white',textTransform:'uppercase',letterSpacing:'3px'}}>PT. Apindo Karya Lestari — Flooring Expert</p>
              <p style={{margin:0,fontSize:'8px',color:'rgba(255,255,255,0.6)',fontWeight:'bold',letterSpacing:'1px'}}>Halaman {pi+1} dari {pages.length}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(InvoiceA4Preview);
