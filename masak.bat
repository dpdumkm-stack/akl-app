@echo off
echo 🍳 Sedang memasak perubahan...
git add .
set /p msg="Masukkan pesan commit: "
git commit -m "%msg%"
git push origin main
echo ✨ Masakan matang dan sudah dikirim ke GitHub!
