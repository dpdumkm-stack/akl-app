import { QuotationData, QuotationItem, InvoiceData } from "./types";

const P_HEIGHT = 1123; 
const SAFE_ZONE_BOTTOM = 65; 
const EFFECTIVE_HEIGHT = P_HEIGHT - SAFE_ZONE_BOTTOM;

const SAFETY_MARGIN = 15; 
const FOOTER_HEIGHT = 180; 
const PAGE1_HEADER = 265; 
const PAGEN_HEADER = 120; 
const THEAD_H = 32;
const TFOOT_H_BASE = 110; 

export function calculatePages(data: QuotationData | InvoiceData) {
  let result: any[] = [];
  let currentH = 0;
  let currentPage: any = { items: [], isFirstPage: true, hasSummary: false, showLingkupSyarat: false, showFooter: false, spacerHeight: 0 };

  const closePage = (pageObj: any, h: number) => {
    // Spacer tetap dihitung berdasarkan P_HEIGHT penuh untuk visual, 
    // tapi pembatasan item menggunakan EFFECTIVE_HEIGHT
    pageObj.spacerHeight = Math.max(0, P_HEIGHT - h - SAFETY_MARGIN);
    result.push({...pageObj});
  };

  const isInvoice = 'invoiceNumber' in data;
  const isHargaSatuanMode = !isInvoice && (data as QuotationData).isHargaSatuanMode;
  const tfootH = isHargaSatuanMode ? 0 : TFOOT_H_BASE;
  currentH = PAGE1_HEADER + THEAD_H;

  const rawItems = data.items || [];
  
  for (let i = 0; i < rawItems.length; i++) {
    const item = rawItems[i];
    const descText = isInvoice ? (item as any).description : (item as any).deskripsi || ' ';
    const bahanText = !isInvoice ? (item as any).bahan : '';
    
    let linesDesc = (descText || '').split('\n').reduce((acc: number, line: string) => acc + Math.max(1, Math.ceil(line.length / 38)), 0);
    let linesBahan = bahanText ? (bahanText as string).split('\n').reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / 42)), 0) : 0;
    let rowH = 22 + (linesDesc * 15) + (linesBahan * 12);
    
    if (currentH + rowH + SAFETY_MARGIN > EFFECTIVE_HEIGHT) {
        closePage(currentPage, currentH);
        currentPage = { items: [item], isFirstPage: false, hasSummary: false, showLingkupSyarat: false, showFooter: false, spacerHeight: 0 };
        currentH = PAGEN_HEADER + THEAD_H + rowH;
    } else {
        currentPage.items.push(item);
        currentH += rowH;
    }
  }

  if (currentH + tfootH + SAFETY_MARGIN > EFFECTIVE_HEIGHT) {
    closePage(currentPage, currentH);
    currentPage = { items: [], isFirstPage: false, hasSummary: true, showLingkupSyarat: false, showFooter: false, spacerHeight: 0 };
    currentH = PAGEN_HEADER + THEAD_H + tfootH;
  } else {
    currentPage.hasSummary = true;
    currentH += tfootH;
  }

  let lLines = !isInvoice && (data as QuotationData).showLingkupKerja ? ((data as QuotationData).lingkupKerja || []).reduce((acc, l) => acc + Math.max(1, Math.ceil((l || '').length / 60)), 0) : 0;
  let sLines = !isInvoice && (data as QuotationData).showSyaratGaransi ? ((data as QuotationData).syaratGaransi || []).reduce((acc, s) => acc + Math.max(1, Math.ceil((s || '').length / 60)), 0) : 0;
  
  const hasMeta = !isInvoice && ((data as QuotationData).showLingkupKerja || (data as QuotationData).showSyaratGaransi);
  const metaH = hasMeta ? (30 + (Math.max(lLines, sLines) * 14)) : 0;
  
  // Hitung estimasi tinggi termin pembayaran (kiri) vs TTD (kanan)
  const termin = isInvoice ? [] : (data as QuotationData).termin || [];
  const termLines = (termin || []).reduce((acc, t) => acc + Math.max(1, Math.ceil((t || '').length / 45)), 0);
  const termsH = isInvoice ? 0 : 40 + (termLines * 12); // Base padding + lines
  const actualFooterH = isInvoice ? 150 : Math.max(FOOTER_HEIGHT, termsH);
  
  const footerWithMetaH = metaH + actualFooterH + 10;

  if (currentH + footerWithMetaH + SAFETY_MARGIN > EFFECTIVE_HEIGHT) {
    closePage(currentPage, currentH);
    currentPage = { 
        items: [], 
        isFirstPage: false, 
        hasSummary: false, 
        showLingkupSyarat: hasMeta, 
        showFooter: true, 
        spacerHeight: 0 
    };
    currentH = PAGEN_HEADER + footerWithMetaH;
  } else {
    currentPage.showLingkupSyarat = hasMeta;
    currentPage.showFooter = true;
    currentH += footerWithMetaH;
  }

  closePage(currentPage, currentH);

  return result.filter(p => 
    p.items.length > 0 || p.hasSummary || p.showLingkupSyarat || p.showFooter || p.isFirstPage
  );
}
