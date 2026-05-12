import { NextRequest, NextResponse } from 'next/server';
import puppeteer, { Browser } from 'puppeteer';

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

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  console.time(`[PDF] Total Generation Time for ${id}`);
  
  const browser = await getBrowser();

  try {
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
        console.error(`[PDF-ENGINE] Failed: ${err.message}`);
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
    console.timeEnd(`[PDF] Total Generation Time for ${id}`);

    return new NextResponse(pdfBuffer as any, {

      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Penawaran_${id}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[PDF] Fatal Error:", error.message);
    // Jika browser crash, reset cache agar next request meluncurkan baru
    if (error.message.includes('browser') || error.message.includes('Target closed')) {
        cachedBrowser = null;
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
