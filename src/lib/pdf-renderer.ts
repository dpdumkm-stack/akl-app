// src/lib/pdf-renderer.ts

import { getBrowser } from '@/lib/pdf-browser';

/**
 * Render a printable page (used for both quotation and invoice) to a PDF Buffer.
 * The printable page is served at `/print/:id` and expects the id to resolve to the
 * correct document type (quotation or invoice) based on the route logic.
 */
export async function renderPdfFromUrl(id: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  const internalPort = process.env.PORT || '3000';
  
  // Menggunakan localhost untuk kompatibilitas lebih baik dengan IPv6/Windows & NEXTAUTH_URL
  const targetUrl = `http://localhost:${internalPort}/print/${id}`;
  
  try {
    console.log(`[PDF-RENDERER] Menavigasi ke: ${targetUrl}`);
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.emulateMediaType('print');
    
    const response = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
    
    if (!response || !response.ok()) {
      const status = response ? response.status() : 'No Response';
      console.error(`[PDF-RENDERER] Navigasi gagal! Status: ${status}, URL: ${targetUrl}`);
      // Jika error page Chrome muncul, log URL saat ini
      console.error(`[PDF-RENDERER] URL saat ini di browser: ${page.url()}`);
    }

    await page.waitForSelector('.a4-page', { timeout: 30000 });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true,
    });
    
    return Buffer.from(pdfBuffer);
  } catch (err: any) {
    console.error(`[PDF-RENDERER] Fatal Error saat render PDF untuk ID ${id}:`, err.message);
    console.error(`[PDF-RENDERER] URL terakhir: ${page.url()}`);
    throw err;
  } finally {
    await page.close();
  }
}
