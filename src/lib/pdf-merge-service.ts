// src/lib/pdf-merge-service.ts

import { PDFDocument } from 'pdf-lib';

/**
 * Merge multiple PDF buffers into a single PDF buffer.
 * The order of the buffers in the array determines the page order.
 */
export async function mergePdfs(buffers: Buffer[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create();
  for (const buf of buffers) {
    const pdf = await PDFDocument.load(buf);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach(page => mergedPdf.addPage(page));
  }
  const mergedBytes = await mergedPdf.save();
  return Buffer.from(mergedBytes);
}
