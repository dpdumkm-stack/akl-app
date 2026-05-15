import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

/**
 * Utility untuk mencatat aktivitas admin ke file log lokal DAN database.
 * Berguna untuk mendiagnosa kegagalan proses di VPS serta audit trail.
 */
export async function logActivity(
  message: string, 
  type: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO',
  userId?: string,
  target?: string
) {
  try {
    // 1. LOG KE FILE (Backup Debugging)
    const logDir = process.env.LOG_DIR || path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'admin_activity.log');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    const timestamp = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const logEntry = `[${timestamp}] [${type}] ${message}${userId ? ` (User: ${userId})` : ''}\n`;

    fs.appendFileSync(logFile, logEntry);
    
    // 2. LOG KE DATABASE (Audit Trail untuk UI)
    if (userId || type === 'SUCCESS' || type === 'ERROR') {
      try {
        await prisma.activityLog.create({
          data: {
            userId: userId || null,
            action: message,
            target: target || type,
            details: `Type: ${type}`,
          }
        });
      } catch (dbErr) {
        console.error("[LOGGER] Gagal menyimpan ke DB:", dbErr);
      }
    }

    // 3. LOG KE CONSOLE
    if (type === 'ERROR') {
      console.error(`[LOGGER] ${message}`);
    } else {
      console.log(`[LOGGER] ${message}`);
    }
  } catch (err) {
    console.error("[LOGGER] Gagal menulis ke file log:", err);
  }
}
