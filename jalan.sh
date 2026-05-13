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

# 3. Deployment via Docker
echo "🏗️ Membangun dan menjalankan container (Docker Compose)..."
docker compose up -d --build

# 5. Cleanup
echo "🧹 Membersihkan image lama..."
docker image prune -f

echo "✅ Pemulihan SELESAI. Cek aplikasi di https://app.apindoepoxy.co.id"
