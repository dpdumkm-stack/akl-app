#!/bin/bash

# --- KONFIGURASI ---
DB_SOURCE="/var/www/akl-app/prisma/dev.db" # Sesuaikan path di VPS
BACKUP_DIR="/var/www/akl-app/backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M")
BACKUP_NAME="backup_akl_db_$TIMESTAMP.db"

# 1. Buat folder backup jika belum ada
mkdir -p $BACKUP_DIR

# 2. Lakukan penyalinan file
cp $DB_SOURCE "$BACKUP_DIR/$BACKUP_NAME"

# 3. Opsional: Hapus backup yang sudah lebih dari 30 hari agar disk tidak penuh
find $BACKUP_DIR -type f -name "*.db" -mtime +30 -delete

echo "✅ Backup berhasil dibuat: $BACKUP_NAME"
