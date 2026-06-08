@echo off
title WA Blast - Salut Etam Betuah
color 0A
cd /d "%~dp0"

echo.
echo ================================================
echo   WA BLAST - SALUT ETAM BETUAH
echo ================================================
echo.

echo [1] Download file terbaru...
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/index.mjs" -o index.mjs
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/package.json" -o package.json

echo [2] Install modul...
if exist node_modules\@whiskeysockets (
    echo     Modul sudah ada.
) else (
    npm install --legacy-peer-deps
)

echo.
echo [3] Jalankan WA Blast...
echo.
echo ================================================
echo   Tunggu QR code, lalu scan dengan WA
echo   Nomor: 0877-8379-4377
echo ================================================
echo.

node index.mjs

echo.
pause
