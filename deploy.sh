#!/bin/bash

# --- KONFIGURASI VPS ---
USER="root"
HOST="IP_VPS_ANDA"
REMOTE_PATH="/var/www/akl-app" # Folder tujuan di VPS

echo "🚀 Memulai proses deployment ke $HOST..."

# 1. Sinkronisasi file menggunakan rsync
# --exclude: Mengabaikan folder yang tidak perlu diunggah agar cepat
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='.env' \
  --exclude='prisma/dev.db' \
  ./ $USER@$HOST:$REMOTE_PATH

echo "✅ File berhasil diunggah."

# 2. Menjalankan perintah di VPS via SSH
# Mengasumsikan Anda sudah menjalankan 'npm run build' dan 'pm2 start' sebelumnya di VPS
echo "🔄 Melakukan reload aplikasi di VPS..."
ssh $USER@$HOST "cd $REMOTE_PATH && npm install && npm run build && pm2 reload akl-app || pm2 start ecosystem.config.js"

echo "✨ Deployment Selesai!"
