#!/bin/sh
set -e

echo "=== AKL App Entrypoint ==="
echo "NODE_ENV: $NODE_ENV"
echo "DATABASE_URL: $DATABASE_URL"
echo "DB_PATH: $DB_PATH"

# Tentukan path database
if [ -n "$DB_PATH" ]; then
  DB_FILE="$DB_PATH"
else
  DB_FILE="/app/data/database.db"
fi

echo "Using database file: $DB_FILE"

# Buat direktori jika belum ada
mkdir -p "$(dirname "$DB_FILE")"

# Set DATABASE_URL jika belum di-set
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:$DB_FILE"
  echo "DATABASE_URL auto-set to: $DATABASE_URL"
fi

# Push schema ke database (buat tabel jika belum ada)
echo "Running prisma db push..."
npx prisma db push --accept-data-loss
echo "Database schema OK."

# Jalankan seed hanya jika database baru (file baru dibuat = ukuran sangat kecil)
DB_SIZE=$(du -b "$DB_FILE" 2>/dev/null | cut -f1 || echo "0")
echo "Database file size: $DB_SIZE bytes"

echo "Starting Next.js (Standalone Mode)..."
exec node server.js
