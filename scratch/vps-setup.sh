#!/bin/bash
set -e

echo '=========================================='
echo '  FIX: Hapus backup file Nginx'
echo '=========================================='
rm -f /etc/nginx/sites-enabled/akl-app.bak
nginx -t 2>&1
nginx -s reload
echo 'Nginx clean ✅'

echo ''
echo '=========================================='
echo '  LANGKAH 4: Transisi Kontainer'
echo '=========================================='

cd /var/www/akl-app

# Hapus kontainer akl-blue yang Created (gagal tadi)
echo 'Menghapus kontainer akl-blue lama (status Created)...'
docker rm akl-blue 2>/dev/null || true

echo 'Mematikan kontainer lama akl-quotation-system & menyalakan akl-blue...'
docker stop akl-quotation-system 2>/dev/null || true
docker rm akl-quotation-system 2>/dev/null || true

echo 'Starting akl-blue...'
docker compose up -d akl-blue

echo 'Menunggu akl-blue healthy (max 90 detik)...'
for i in $(seq 1 30); do
  HEALTH=$(docker inspect -f '{{.State.Health.Status}}' akl-blue 2>/dev/null || echo 'starting')
  echo "  [$i] Status: $HEALTH"
  if [ "$HEALTH" = "healthy" ]; then
    echo 'akl-blue is HEALTHY! ✅'
    break
  fi
  sleep 3
done

echo ''
echo '=========================================='
echo '  LANGKAH 5: Make script executable'
echo '=========================================='
chmod +x /var/www/akl-app/deploy-zero-downtime.sh
echo 'deploy-zero-downtime.sh is executable ✅'

echo ''
echo '=========================================='
echo '  FINAL STATUS'
echo '=========================================='
docker ps -a --filter 'name=akl-' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
echo ''
echo 'Nginx upstream:'
cat /etc/nginx/conf.d/akl-upstream.conf
echo ''
echo 'Nginx site proxy_pass:'
grep 'proxy_pass' /etc/nginx/sites-enabled/akl-app
echo ''
echo '✨ SETUP SELESAI!'
