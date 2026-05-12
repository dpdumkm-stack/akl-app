import fs from 'fs';
import path from 'path';

/**
 * Utility untuk mencatat aktivitas admin ke file log lokal.
 * Berguna untuk mendiagnosa kegagalan proses di VPS.
 */
export function logActivity(message: string, type: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO') {
  try {
    // SCSA FIX: Gunakan path absolut untuk file log agar konsisten di Linux/Docker
    const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'admin_activity.log');

    // Pastikan direktori log ada
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const logEntry = `[${timestamp}] [${type}] ${message}\n`;

    fs.appendFileSync(logFile, logEntry);
    
    // Juga log ke console agar terlihat di docker logs
    if (type === 'ERROR') {
      console.error(`[LOGGER] ${message}`);
    } else {
      console.log(`[LOGGER] ${message}`);
    }
  } catch (err) {
    console.error("[LOGGER] Gagal menulis ke file log:", err);
  }
}
