@echo off
setlocal enabledelayedexpansion

echo 🍳 [STEP 1/4] Menyiapkan bumbu (Prisma Generate)...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Gagal menyiapkan Prisma! Periksa schema.prisma Anda.
    pause
    exit /b %errorlevel%
)

echo 🧼 [STEP 2/4] Membersihkan dapur (Linting)...
echo (Menjalankan pengecekan kode otomatis...)
call npm run lint
if %errorlevel% neq 0 (
    echo ❌ Ada error pada kode! Perbaiki error di atas sebelum melakukan push.
    pause
    exit /b %errorlevel%
)

echo 📝 [STEP 3/4] Mencatat resep (Commit)...
git add .

:: Cek apakah ada perubahan yang perlu di-commit
git diff --cached --quiet
if %errorlevel% eq 0 (
    echo ℹ️ Tidak ada perubahan baru untuk dimasak.
    pause
    exit /b 0
)

set /p msg="Masukkan pesan commit (kosongkan untuk pesan otomatis): "
if "%msg%"=="" (
    set msg="update: perbaikan rutin dan optimasi sistem [auto-commit]"
)

git commit -m "%msg%"

echo 🚀 [STEP 4/4] Mengirim masakan ke server (Push)...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Gagal mengirim ke GitHub! Periksa koneksi atau konflik git.
    pause
    exit /b %errorlevel%
)

echo.
echo ✨ MASAKAN MATANG! Kode telah dikirim ke GitHub.
echo 🏗️  GitHub Actions sedang membangun image di server GitHub (Hemat RAM VPS).
echo ⏳ PENTING: Tunggu 5-10 menit untuk proses build & push selesai.
echo 🛡️  VPS akan otomatis mengambil image jadi setelah build selesai.
echo.
pause
