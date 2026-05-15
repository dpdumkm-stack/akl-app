@echo off
setlocal enabledelayedexpansion

:: ==========================================================
:: SMART MASAK v2.0 - Studio AKL Deployment Suite
:: ==========================================================
:: Deskripsi: Script otomatisasi Prisma, Linting, dan Git Push.
:: Fitur Baru: Argumen Pesan, Auto-Fix Lint, & Interactive Bypass.
:: ==========================================================

:: Ambil pesan dari argument pertama jika ada
set msg_arg=%~1

echo.
echo 🍳 [STEP 1/4] Menyiapkan bumbu (Prisma Generate)...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Gagal menyiapkan Prisma! Periksa schema.prisma Anda.
    pause
    exit /b %errorlevel%
)

echo.
echo 🧼 [STEP 2/4] Membersihkan dapur (Linting & Auto-Fix)...
:: Mencoba memperbaiki otomatis jika memungkinkan (misal: spasi, titik koma)
call npm run lint -- --fix
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Dapur agak berantakan! Ada peringatan/error linting yang membandel.
    set /p bypass="Tetap lanjut masak dan abaikan linting? (y/n): "
    if /i "!bypass!" neq "y" (
        echo ❌ Masakan dibatalkan. Silakan perbaiki kode terlebih dahulu.
        pause
        exit /b %errorlevel%
    )
    echo ⏩ Melanjutkan masakan (Linting diabaikan atas permintaan Admin)...
)

echo.
echo 📝 [STEP 3/4] Mencatat resep (Commit)...
git add .

:: Cek apakah ada perubahan yang perlu di-commit
git diff --cached --quiet
if %errorlevel% eq 0 (
    echo ℹ️  Tidak ada bahan baru yang perlu dimasak (No changes to commit).
    pause
    exit /b 0
)

:: Logika Pesan Commit
if "%msg_arg%"=="" (
    set /p msg="Masukkan pesan resep/commit (kosongkan untuk otomatis): "
) else (
    set msg=%msg_arg%
)

if "!msg!"=="" (
    set msg="update: perbaikan rutin dan optimasi sistem [auto-commit]"
)

git commit -m "!msg!"

echo.
echo 🚀 [STEP 4/4] Mengirim masakan ke server (Pushing to GitHub)...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo ❌ Gagal mengirim ke GitHub! 
    echo ℹ️  Saran: Coba jalankan 'git pull' jika ada konflik dengan rekan tim.
    pause
    exit /b %errorlevel%
)

:: Mencatat ke Log Aktivitas
if not exist logs mkdir logs
echo [%date% %time%] [DEPLOY] !msg! >> logs\admin_activity.log

echo.
echo ==========================================================
echo ✨ MASAKAN MATANG SEMPURNA!
echo ==========================================================
echo 🏗️  GitHub Actions sedang membangun image (Estimasi 5-10 menit).
echo 🛡️  VPS Anda akan otomatis terupdate setelah proses build selesai.
echo ==========================================================
echo.
pause
