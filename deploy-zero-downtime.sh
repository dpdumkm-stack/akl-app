#!/bin/bash
# =============================================================
# deploy-zero-downtime.sh
# Script Blue-Green Deployment untuk AKL App
# Menjamin ZERO DOWNTIME saat pergantian kontainer.
# v2: Tambah auto-rollback jika kontainer baru gagal healthy
# =============================================================
set -e

NGINX_CONF="/etc/nginx/conf.d/akl-upstream.conf"
PROJECT_DIR="/var/www/akl-app"

# Warna untuk log
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
success() { echo -e "${GREEN}[$(date '+%H:%M:%S')] ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}"; }
error() { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}"; exit 1; }

# =============================================================
# LANGKAH 1: Deteksi slot mana yang sedang aktif
# =============================================================
detect_active_slot() {
  log "🔍 Mendeteksi slot aktif..."

  BLUE_RUNNING=$(docker inspect -f '{{.State.Running}}' akl-blue 2>/dev/null || echo "false")
  GREEN_RUNNING=$(docker inspect -f '{{.State.Running}}' akl-green 2>/dev/null || echo "false")

  if [ "$BLUE_RUNNING" = "true" ] && [ "$GREEN_RUNNING" = "false" ]; then
    ACTIVE_SLOT="blue"
    INACTIVE_SLOT="green"
    ACTIVE_PORT=3000
    INACTIVE_PORT=3001
  elif [ "$GREEN_RUNNING" = "true" ] && [ "$BLUE_RUNNING" = "false" ]; then
    ACTIVE_SLOT="green"
    INACTIVE_SLOT="blue"
    ACTIVE_PORT=3001
    INACTIVE_PORT=3000
  elif [ "$BLUE_RUNNING" = "true" ] && [ "$GREEN_RUNNING" = "true" ]; then
    warn "Kedua slot berjalan. Mematikan Green untuk digunakan sebagai target..."
    docker stop akl-green 2>/dev/null || true
    ACTIVE_SLOT="blue"
    INACTIVE_SLOT="green"
    ACTIVE_PORT=3000
    INACTIVE_PORT=3001
  else
    warn "Tidak ada kontainer aktif. Melakukan fresh deploy ke slot Blue..."
    ACTIVE_SLOT="none"
    INACTIVE_SLOT="blue"
    ACTIVE_PORT=0
    INACTIVE_PORT=3000
  fi

  if [ "$ACTIVE_SLOT" != "none" ]; then
    success "Slot aktif: ${ACTIVE_SLOT^^} (port $ACTIVE_PORT) → Deploy ke: ${INACTIVE_SLOT^^} (port $INACTIVE_PORT)"
  else
    success "Fresh deploy → Target: ${INACTIVE_SLOT^^} (port $INACTIVE_PORT)"
  fi
}

# =============================================================
# AUTO-ROLLBACK: Hidupkan kembali slot lama jika deploy gagal
# =============================================================
rollback() {
  echo ""
  warn "🔄 AUTO-ROLLBACK: Menghidupkan kembali slot lama..."

  if [ "$ACTIVE_SLOT" = "none" ]; then
    error "Tidak ada slot lama untuk di-rollback. Situs mati total!"
  fi

  cd "$PROJECT_DIR"
  docker compose up -d "akl-${ACTIVE_SLOT}" || true

  # Pastikan Nginx kembali ke slot lama
  if [ -f "$NGINX_CONF" ]; then
    cat > "$NGINX_CONF" <<EOF
# Auto-generated oleh deploy-zero-downtime.sh (ROLLBACK)
# Slot aktif: ${ACTIVE_SLOT^^} — $(date '+%Y-%m-%d %H:%M:%S')
upstream akl_backend {
    server 127.0.0.1:${ACTIVE_PORT};
}
EOF
    nginx -t 2>/dev/null && nginx -s reload || true
  fi

  # Bersihkan slot yang gagal
  docker stop "akl-${INACTIVE_SLOT}" 2>/dev/null || true
  docker rm "akl-${INACTIVE_SLOT}" 2>/dev/null || true

  warn "Rollback ke ${ACTIVE_SLOT^^} selesai. Situs kembali online dengan versi lama."
  error "Deploy GAGAL — Rollback berhasil. Pipeline dihentikan."
}

# =============================================================
# LANGKAH 2: Nyalakan slot baru dengan image terbaru
# =============================================================
start_new_slot() {
  log "🚀 Menyalakan slot ${INACTIVE_SLOT^^} dengan image terbaru..."

  cd "$PROJECT_DIR"

  docker stop "akl-${INACTIVE_SLOT}" 2>/dev/null || true
  docker rm "akl-${INACTIVE_SLOT}" 2>/dev/null || true

  docker compose up -d "akl-${INACTIVE_SLOT}"

  success "Slot ${INACTIVE_SLOT^^} dimulai. Menunggu healthcheck..."
}

# =============================================================
# LANGKAH 3: Tunggu sampai slot baru healthy
# =============================================================
wait_for_healthy() {
  log "🏥 Menunggu slot ${INACTIVE_SLOT^^} menjadi HEALTHY..."

  MAX_WAIT=180
  ELAPSED=0
  INTERVAL=5

  while [ $ELAPSED -lt $MAX_WAIT ]; do
    HEALTH=$(docker inspect -f '{{.State.Health.Status}}' "akl-${INACTIVE_SLOT}" 2>/dev/null || echo "unknown")
    RUNNING=$(docker inspect -f '{{.State.Running}}' "akl-${INACTIVE_SLOT}" 2>/dev/null || echo "false")

    # Jika kontainer crash, langsung rollback
    if [ "$RUNNING" = "false" ]; then
      echo ""
      warn "Kontainer ${INACTIVE_SLOT^^} crash!"
      echo "--- Log terakhir kontainer ---"
      docker logs --tail 30 "akl-${INACTIVE_SLOT}" 2>/dev/null || true
      echo "------------------------------"
      rollback
    fi

    if [ "$HEALTH" = "healthy" ]; then
      success "Slot ${INACTIVE_SLOT^^} HEALTHY setelah ${ELAPSED} detik! 🎉"
      return 0
    fi

    echo -ne "\r  ⏳ Status: ${HEALTH} (${ELAPSED}s / ${MAX_WAIT}s)..."
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
  done

  echo ""
  warn "Slot ${INACTIVE_SLOT^^} GAGAL healthy dalam ${MAX_WAIT} detik. Melakukan rollback..."
  rollback
}

# =============================================================
# LANGKAH 4: Switch Nginx upstream ke slot baru
# =============================================================
switch_nginx() {
  log "🔄 Mengalihkan Nginx ke slot ${INACTIVE_SLOT^^} (port ${INACTIVE_PORT})..."

  cat > "$NGINX_CONF" <<EOF
# Auto-generated oleh deploy-zero-downtime.sh
# Slot aktif: ${INACTIVE_SLOT^^} — $(date '+%Y-%m-%d %H:%M:%S')
upstream akl_backend {
    server 127.0.0.1:${INACTIVE_PORT};
}
EOF

  if nginx -t 2>/dev/null; then
    nginx -s reload
    success "Nginx berhasil di-reload → upstream ke port ${INACTIVE_PORT}"
  else
    warn "Konfigurasi Nginx GAGAL! Rollback..."
    rollback
  fi
}

# =============================================================
# LANGKAH 5: Matikan slot lama
# =============================================================
stop_old_slot() {
  if [ "$ACTIVE_SLOT" = "none" ]; then
    log "ℹ️  Tidak ada slot lama untuk dimatikan (fresh deploy)."
    return
  fi

  log "🛑 Mematikan slot lama ${ACTIVE_SLOT^^}..."
  sleep 3
  docker stop "akl-${ACTIVE_SLOT}" 2>/dev/null || true
  docker rm "akl-${ACTIVE_SLOT}" 2>/dev/null || true
  success "Slot lama ${ACTIVE_SLOT^^} dimatikan."
}

# =============================================================
# LANGKAH 6: Cleanup
# =============================================================
cleanup() {
  log "🧹 Membersihkan image & cache lama..."
  docker image prune -f 2>/dev/null || true
  success "Cleanup selesai."
}

# =============================================================
# MAIN
# =============================================================
echo ""
echo "=========================================================="
echo "   🚀 AKL App — Zero-Downtime Blue-Green Deployment v2"
echo "=========================================================="
echo ""

detect_active_slot
start_new_slot
wait_for_healthy
switch_nginx
stop_old_slot
cleanup

echo ""
echo "=========================================================="
echo "   ✨ DEPLOYMENT SELESAI — ZERO DOWNTIME! ✨"
echo "=========================================================="
echo "   Slot aktif sekarang: ${INACTIVE_SLOT^^} (port ${INACTIVE_PORT})"
echo "=========================================================="
echo ""

docker ps --filter "name=akl-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
