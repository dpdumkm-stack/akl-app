const Database = require('better-sqlite3');
const path = require('path');

try {
    const dbPath = path.resolve(__dirname, 'prisma', 'dev.db');
    console.log("Checking DB at:", dbPath);
    const db = new Database(dbPath);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables found:", tables);
    
    if (tables.some(t => t.name === 'MasterItem')) {
        const count = db.prepare("SELECT COUNT(*) as count FROM MasterItem").get();
        console.log("MasterItem count:", count);
    } else {
        console.log("CRITICAL: MasterItem table NOT FOUND!");
    }
    db.close();
} catch (err) {
    console.error("Raw SQLite Error:", err.message);
}
