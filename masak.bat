@echo off
setlocal enabledelayedexpansion

:: ==========================================================
:: SMART MASAK v2.2 - Studio AKL Deployment Suite
:: ==========================================================
:: Fitur: Prisma, Lint (Auto-Fix + Log), Commit, & Push.
:: Log Masalah: logs/lint_issues.log
:: Logic Penanganan Error: Auto-Retry & Smart-Pull.
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

set retry_count=0
:push_loop
git push origin main
if %errorlevel% neq 0 (
    set /a retry_count+=1
    echo.
    echo ⚠️  Gagal mengirim masakan (Percobaan ke-!retry_count!/3).
    
    if !retry_count! lss 3 (
        echo ⏳ Menunggu 5 detik sebelum mencoba lagi...
        timeout /t 5 > nul
        goto push_loop
    )

    echo.
    echo ❌ Masih gagal setelah 3 kali percobaan.
    echo 💡 Kemungkinan penyebab:
    echo    1. Masalah server GitHub (seperti 502 Bad Gateway tadi).
    echo    2. Ada perubahan baru di GitHub yang belum Anda ambil (Conflict).
    
    set /p choice="Ingin mencoba sinkronisasi (git pull) lalu push ulang? (y/n): "
    if /i "!choice!"=="y" (
        echo 🔄 Mencoba menyamakan resep (Pulling with rebase)...
        git pull origin main --rebase
        if !errorlevel! eq 0 (
            set retry_count=0
            echo ✅ Sinkronisasi sukses! Mencoba push ulang...
            goto push_loop
        ) else (
            echo ❌ Gagal sinkronisasi otomatis. Ada konflik manual yang harus diselesaikan.
        )
    )
    
    pause
    exit /b 1
)

:: Catat ke Log Aktivitas
echo [%date% %time%] [DEPLOY] !msg! >> logs\admin_activity.log

echo.
echo ==========================================================
echo ✨ MASAKAN MATANG SEMPURNA!
echo ==========================================================
echo 🏗️  GitHub Actions sedang membangun image (5-10 menit).
echo 🛡️  VPS Anda akan otomatis terupdate.
echo ==========================================================
echo.
pause
