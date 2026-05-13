#!/bin/bash
# Emergency Recovery Script for AKL App
# Usage: ./jalan.sh

echo "🚀 Memulai sinkronisasi dan pemulihan server..."

# 1. Fix Git Safe Directory (Solusi Git Exit Code 128)
git config --global --add safe.directory "*"

# 2. Sync from GitHub
echo "🔄 Mengambil kode terbaru dari GitHub..."
git pull origin main
if [ $? -ne 0 ]; then
  echo "❌ Git Pull Gagal. Mencoba paksa (Force Reset)..."
  git reset --hard origin/main
  git pull origin main
fi

# 3. Install dependencies
echo "📦 Menginstall dependencies..."
npm install --no-audit --no-fund

# 4. Build Application
echo "🏗️ Membangun aplikasi (Next.js Build)..."
# Membatasi memori Node untuk mencegah hang saat build di VPS kecil
export NODE_OPTIONS="--max-old-space-size=2048"
npm run build

# 5. Restart PM2
echo "♻️ Merestart server PM2..."
# Asumsi nama app di PM2 adalah akl-app. Jika berbeda, PM2 akan mencoba mencari.
pm2 restart all || pm2 start npm --name "akl-app" -- run start

echo "✅ Pemulihan SELESAI. Cek aplikasi di https://app.apindoepoxy.co.id"
