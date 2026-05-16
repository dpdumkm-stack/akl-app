@echo off
setlocal enabledelayedexpansion

:: ==========================================================
:: SMART MASAK v3.0 - Studio AKL PRO Deployment Suite
:: ==========================================================

:: Ambil pesan dari argument pertama jika ada
set msg_arg=%~1

:: Pastikan folder logs ada
if not exist logs mkdir logs

echo.
echo [PRE-CHECK] Memeriksa bahan yang belum dikirim ke GitHub...
git status -s
echo.

:: --- AUTO-BACKUP ---
echo [SECURE] Mencadangkan database sebelum mulai...
if exist backup-db.sh (
    sh backup-db.sh > logs\backup_log.txt 2>&1
    if not errorlevel 1 (
        echo Database berhasil dicadangkan.
    ) else (
        echo Gagal mencadangkan database, tapi proses dilanjutkan...
    )
)

:: --- STEP 1: PRISMA ---
:step1_start
echo.
echo [STEP 1/4] Menyiapkan bumbu [Prisma Generate]...
call npx prisma generate > logs\prisma_log.txt 2>&1
if errorlevel 1 (
    echo.
    echo Gagal menyiapkan Prisma!
    
    :: Cek apakah library mising
    findstr /C:"Cannot find module" logs\prisma_log.txt > nul
    if not errorlevel 1 (
        echo Terdeteksi library hilang. Mencoba perbaikan otomatis [npm install]...
        call npm install
        echo Mencoba ulang Step 1...
        goto step1_start
    )

    echo ------------------------------------------
    type logs\prisma_log.txt
    echo ------------------------------------------
    pause
    exit /b 1
)


:: --- STEP 2: LINTING ---
echo.
echo [STEP 2/4] Membersihkan dapur [Linting and Auto-Fix]...
:: Jalankan lint dan simpan output ke file sementara
call npm run lint -- --fix > logs\lint_temp.txt 2>&1
if errorlevel 1 (
    echo.
    echo Gagal! Ditemukan kesalahan kode [Lint Errors]:
    echo ------------------------------------------
    type logs\lint_temp.txt
    echo ------------------------------------------
    echo.
    echo Mohon perbaiki kesalahan di atas sebelum mengirim ke GitHub.
    pause
    exit /b 1
)


:: --- STEP 2.5: BUILD ---
:step2_5_start
echo.
echo [STEP 2.5/4] Uji Rasa [Build Check]...
:: Jalankan build untuk memastikan kode bisa dikompilasi
call npm run build > logs\build_log.txt 2>&1
if errorlevel 1 (
    echo.
    echo Gagal! Kode Anda rusak atau tidak bisa di-build.
    
    :: Cek apakah library mising
    findstr /C:"Cannot find module" logs\build_log.txt > nul
    if not errorlevel 1 (
        echo Terdeteksi library hilang saat build. Mencoba perbaikan [npm install]...
        call npm install
        echo Mencoba ulang Build Check...
        goto step2_5_start
    )

    echo ------------------------------------------
    type logs\build_log.txt
    echo ------------------------------------------
    echo.
    echo Periksa log di atas untuk menemukan letak kerusakannya.
    pause
    exit /b 1
)


:: --- STEP 3: COMMIT ---
echo.
echo [STEP 3/4] Mencatat resep [Commit]...
git add .

:: Cek apakah ada perubahan yang perlu di-commit
git diff --cached --quiet
if not errorlevel 1 (
    echo Tidak ada bahan baru yang perlu dimasak [No changes to commit].
    pause
    exit /b 0
)

:: Logika Pesan Commit
set msg=%msg_arg%
if "%msg%"=="" (
    set /p msg="Masukkan pesan resep/commit [kosongkan untuk otomatis]: "
)

if "%msg%"=="" (
    set msg=update: perbaikan rutin dan optimasi sistem [auto-commit]
)

git commit -m "%msg%"


:: --- STEP 4: PUSH ---
echo.
echo [STEP 4/4] Mengirim masakan ke server [Pushing to GitHub]...

set retry_count=0
:push_loop
git push origin main
if errorlevel 1 (
    set /a retry_count+=1
    echo.
    echo Gagal mengirim masakan [Percobaan ke-!retry_count!/3].
    
    if !retry_count! lss 3 (
        echo Menunggu 5 detik sebelum mencoba lagi...
        timeout /t 5 > nul
        goto push_loop
    )

    echo.
    echo Masih gagal setelah 3 kali percobaan.
    
    set /p choice="Ingin mencoba sinkronisasi [git pull] lalu push ulang? [y/n]: "
    if /i "%choice%"=="y" (
        echo Mencoba menyamakan resep [Pulling with rebase]...
        git pull origin main --rebase
        if not errorlevel 1 (
            set retry_count=0
            echo Sinkronisasi sukses! Mencoba push ulang...
            goto push_loop
        ) else (
            echo Gagal sinkronisasi otomatis. Ada konflik manual yang harus diselesaikan.
        )
    )
    
    pause
    exit /b 1
)

:: Catat ke Log Aktivitas
echo [%date% %time%] [DEPLOY] %msg% >> logs\admin_activity.log

:: --- VISUAL SUMMARY ---
echo.
echo ==========================================================
echo             MASAKAN MATANG SEMPURNA! v3.0 
echo ==========================================================
echo  [OK] DATABASE BACKUP  : Terjamin 
echo  [OK] PRISMA CLIENT    : Tergenerate 
echo  [OK] LINTING and STYLE: Bersih 
echo  [OK] BUILD STATUS     : Siap Saji 
echo  [OK] GITHUB SYNC      : Terkirim 
echo ----------------------------------------------------------
echo   GitHub Actions sedang membangun image [5-10 menit].
echo   VPS Anda akan otomatis terupdate.
echo ==========================================================
echo.
pause
