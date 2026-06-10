@echo off
title WA Blast - Salut Etam Betuah v3
color 0A
cd /d "%~dp0"

echo.
echo ================================================
echo   WA BLAST - SALUT ETAM BETUAH v3
echo ================================================
echo.

echo [1] Download file terbaru...
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/index.mjs" -o index.mjs
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/package.json" -o package.json

echo [2] Hapus auth lama (reset koneksi)...
if exist auth_salut rmdir /s /q auth_salut
echo     Auth direset.

echo [3] Install modul...
if exist node_modules\@whiskeysockets (
    echo     Modul sudah ada.
) else (
    npm install --legacy-peer-deps
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
