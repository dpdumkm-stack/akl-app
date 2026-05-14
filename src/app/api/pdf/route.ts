import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';
import { logActivity } from "@/lib/logger";

let cachedBrowser: Browser | null = null;


async function getBrowser() {
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }
  
  try {
    // SCSA CLOUD READY: Gunakan executable path dari env jika ada (penting untuk Docker/Linux)
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    
    cachedBrowser = await puppeteer.launch({
      headless: true,
      executablePath: executablePath,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-gpu', 
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions'
      ]
    });
    return cachedBrowser;
  } catch (err) {
    console.error("[PDF-ENGINE] Browser Launch Failed:", err);
    cachedBrowser = null;
    throw err;
  }
}


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const mode = searchParams.get('mode') || 'attachment';

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
  
  logActivity(`Memulai pembuatan PDF untuk ID: ${id} (Mode: ${mode})`, 'INFO');

  console.time(`[PDF] Total Generation Time for ${id}`);
  
  const browser = await getBrowser();
  let filename = `Dokumen_${id}.pdf`;

  try {
    // SCSA: Ambil nomor dokumen & identitas untuk filename yang lebih baik
    const [q, inv] = await Promise.all([
      prisma.quotation.findUnique({ where: { id }, select: { nomorSurat: true, companyName: true, up: true } }),
      prisma.invoice.findUnique({ where: { id }, select: { invoiceNumber: true, companyName: true, clientName: true } })
    ]);
    
    if (q) {
      const identitas = q.companyName || q.up || "";
      filename = `${q.nomorSurat} ${identitas}`.trim().replace(/[/\\?%*:|"<>]/g, '_') + ".pdf";
    } else if (inv) {
      const identitas = inv.companyName || inv.clientName || "";
      filename = `${inv.invoiceNumber} ${identitas}`.trim().replace(/[/\\?%*:|"<>]/g, '_') + ".pdf";
    }

    const page = await browser.newPage();
    
    // SCSA FIX: Set global timeouts to 60s
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(60000);
    
    // SCSA STABLE BASELINE
    await page.setJavaScriptEnabled(true);

    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const type = request.resourceType();
      if (['document', 'stylesheet', 'image', 'font', 'script'].includes(type)) request.continue();
      else request.abort();
    });

    // SCSA CLOUD FIX: Selalu gunakan internal port 3000 untuk Puppeteer di dalam VPS/Docker
    // Ini menghindari masalah firewall saat server mencoba memanggil domain publiknya sendiri
    const internalPort = process.env.PORT || '3000';
    const targetUrl = `http://127.0.0.1:${internalPort}/print/${id}`;
    
    console.log(`[PDF-ENGINE] Processing (Internal): ${targetUrl}`);

    
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
    await page.emulateMediaType('print');

    try {
        await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // SCSA FIX: Tunggu semua gambar (terutama Base64) selesai didecode
        await page.evaluate(async () => {
          const selectors = Array.from(document.querySelectorAll('img'));
          await Promise.all(selectors.map(img => {
            if (img.complete) return;
            return new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              // Timeout 10 detik per gambar agar tidak stuck selamanya
              setTimeout(() => resolve(true), 10000);
            });
          }));
        });

        await page.waitForSelector('.a4-page', { timeout: 20000 });
        console.log(`[PDF-ENGINE] Rendered: ${id}`);
    } catch (err: any) {
        const content = await page.content();
        console.error(`[PDF-ENGINE] Failed: ${err.message}. Page Content: ${content.substring(0, 500)}`);
        throw err;
    }

    // Jeda kecil untuk finalisasi rendering grafis
    await new Promise(r => setTimeout(r, 500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      preferCSSPageSize: true
    });


    await page.close();
    logActivity(`Berhasil membuat PDF untuk ID: ${id}`, 'SUCCESS');
    console.timeEnd(`[PDF] Total Generation Time for ${id}`);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${mode}; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      },
    });
  } catch (error: any) {
    logActivity(`GAGAL membuat PDF untuk ID: ${id}. Error: ${error.message}`, 'ERROR');
    console.error("[PDF] Fatal Error:", error.message);
    // Jika browser crash, reset cache agar next request meluncurkan baru
    if (error.message.includes('browser') || error.message.includes('Target closed')) {
        cachedBrowser = null;
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
