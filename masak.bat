@echo off
setlocal enabledelayedexpansion

:: ==========================================================
:: SMART MASAK v2.1 - Studio AKL Deployment Suite
:: ==========================================================
:: Fitur: Prisma, Lint (Auto-Fix + Log), Commit, & Push.
:: Log Masalah: logs/lint_issues.log
:: ==========================================================

:: Ambil pesan dari argument pertama jika ada
set msg_arg=%~1

:: Pastikan folder logs ada
if not exist logs mkdir logs

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
:: Jalankan lint dan simpan output ke file sementara
call npm run lint -- --fix > logs\lint_temp.txt 2>&1
set lint_status=%errorlevel%

if %lint_status% neq 0 (
    echo.
    echo ⚠️  Ditemukan beberapa masalah pada kode:
    echo ------------------------------------------
    type logs\lint_temp.txt
    echo ------------------------------------------
    echo.
    set /p bypass="Tetap lanjut masak dan simpan daftar error ke log? (y/n): "
    if /i "!bypass!" neq "y" (
        echo ❌ Masakan dibatalkan. Silakan perbaiki kode terlebih dahulu.
        if exist logs\lint_temp.txt del logs\lint_temp.txt
        pause
        exit /b %lint_status%
    )
    
    :: Arsipkan error ke log permanen agar tidak terlupakan
    echo [%date% %time%] MASALAH TERTUNDA: >> logs\lint_issues.log
    type logs\lint_temp.txt >> logs\lint_issues.log
    echo ------------------------------------------ >> logs\lint_issues.log
    echo ⏩ Melanjutkan masakan. Daftar PR tersimpan di logs/lint_issues.log
)
if exist logs\lint_temp.txt del logs\lint_temp.txt

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
    echo ℹ️  Saran: Coba jalankan 'git pull' jika ada konflik.
    pause
    exit /b %errorlevel%
)

:: Catat ke Log Aktivitas
echo [%date% %time%] [DEPLOY] !msg! >> logs\admin_activity.log

echo.
echo ==========================================================
echo ✨ MASAKAN MATANG! (Cek logs/lint_issues.log untuk PR)
echo ==========================================================
echo 🏗️  GitHub Actions sedang membangun image (5-10 menit).
echo 🛡️  VPS Anda akan otomatis terupdate.
echo ==========================================================
echo.
pause
