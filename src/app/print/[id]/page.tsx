import React from "react";
import { prisma } from "@/lib/prisma";
import A4Preview from "@/components/A4Preview";
import InvoiceA4Preview from "@/components/InvoiceA4Preview";
import { getQuotationForPDF } from "@/lib/pdf-data-service";
import { getInvoiceForPDF } from "@/lib/pdf-invoice-service";
import { QuotationData, InvoiceData } from "@/lib/types";

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Try to load as Quotation first
  let quotation: QuotationData | null = await getQuotationForPDF(id);
  let invoice: InvoiceData | null = null;
  
  if (!quotation) {
    invoice = await getInvoiceForPDF(id);
  }

  if (!quotation && !invoice) {
    return <div>Dokumen tidak ditemukan</div>;
  }

  const isInvoice = !!invoice;
  const data = quotation || invoice;

  // Calculate page height based on document type (both use same A4 dimensions)
  const { calculatePages } = await import('@/lib/paginator');
  const pages = calculatePages(data as any);
  const totalHeight = pages.length * 1123; // 1123px per A4 page

  // Load global settings for logo/TTD fallback
  const { getGlobalSettings } = await import('@/app/actions');
  const settings = await getGlobalSettings();
  let globalLogo = null;
  let globalTTD = null;
  if (settings.success && 'data' in settings) {
    globalLogo = settings.data.find((s: any) => s.id === 'LOGO')?.value || null;
    globalTTD = settings.data.find((s: any) => s.id === 'TTD')?.value || null;
  }

  return (
    <div style={{
      background: 'white',
      width: '794px',
      height: `${totalHeight}px`,
      overflow: 'hidden',
      margin: '0',
      padding: '0',
    }}>
      {isInvoice ? (
        <InvoiceA4Preview
          data={invoice as InvoiceData}
          isGeneratingPDF={true}
          globalLogoUrl={globalLogo}
          globalTTDUrl={globalTTD}
        />
      ) : (
        <A4Preview
          data={quotation as QuotationData}
          isGeneratingPDF={true}
          globalLogoUrl={globalLogo}
          globalTTDUrl={globalTTD}
        />
      )}
    </div>
  );
}
