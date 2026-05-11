// src/lib/pdf-browser.ts

import puppeteer, { Browser } from 'puppeteer';

let cachedBrowser: Browser | null = null;

/**
 * Retrieve a shared Puppeteer browser instance. Re‑uses the same browser across
 * calls to avoid the heavy launch cost. If the browser crashes it will be reset.
 */
export async function getBrowser(): Promise<Browser> {
  if (cachedBrowser && cachedBrowser.connected) {
    return cachedBrowser;
  }
  try {
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    cachedBrowser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
      ],
    });
    return cachedBrowser;
  } catch (err) {
    console.error('[PDF-BROWSER] Launch failed:', err);
    cachedBrowser = null;
    throw err;
  }
}
