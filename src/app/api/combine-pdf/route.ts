// src/app/api/combine-pdf/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from 'next-auth/react';
import { prisma } from '@/lib/prisma';
import { mergePdfs } from '@/lib/pdf-merge-service';
import { renderPdfFromUrl } from '@/lib/pdf-renderer';

/**
 * Endpoint to return a combined PDF (Quotation first, then Invoice).
 * Uses the shared PDF renderer to generate each document as a Buffer.
 */
export async function GET(req: NextRequest) {
  const session = await getSession({ req: { headers: req.headers } as any });
  if (!(session?.user as any)?.role?.includes('admin')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const quotationId = searchParams.get('quotationId');
  const invoiceId = searchParams.get('invoiceId');

  if (!quotationId || !invoiceId) {
    return NextResponse.json({ error: 'quotationId and invoiceId required' }, { status: 400 });
  }

  try {
    // Generate individual PDFs via the unified renderer
    const [quotationPdf, invoicePdf] = await Promise.all([
      renderPdfFromUrl(quotationId),
      renderPdfFromUrl(invoiceId),
    ]);

    // Merge (quotation first, then invoice)
    const mergedPdf = await mergePdfs([quotationPdf, invoicePdf]);

    // Retrieve invoice number for naming
    const inv = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    const fileName = inv?.invoiceNumber ? `${inv.invoiceNumber}_full.pdf` : 'combined.pdf';

    return new NextResponse(mergedPdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error('[COMBINE-PDF] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate combined PDF' }, { status: 500 });
  }
}
