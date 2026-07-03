@echo off
title WA Blast - Salut Etam Betuah v4
color 0A
cd /d "%~dp0"

echo.
echo ================================================
echo   WA BLAST - SALUT ETAM BETUAH v4
echo ================================================
echo.

echo [1] Download file terbaru...
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/index.mjs" -o index.mjs
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/package.json" -o package.json

echo [2] Hapus auth lama (reset koneksi)...
if exist auth_salut rmdir /s /q auth_salut
echo     Auth direset.

echo [3] Cek modul...
if exist .installed_v4 (
    echo     Modul sudah versi terbaru.
) else (
    echo     Update modul Baileys ke versi terbaru ^(perbaikan Error 405^)...
    if exist node_modules rmdir /s /q node_modules
    if exist package-lock.json del /q package-lock.json
    npm install --legacy-peer-deps
    echo installed > .installed_v4
)

echo.
echo [4] Jalankan WA Blast...
echo.
echo ================================================
echo   QR akan muncul — scan dengan WA di HP
echo   Jika error 405: otomatis coba fingerprint lain
echo ================================================
echo.

node index.mjs --reset

echo.
pause
