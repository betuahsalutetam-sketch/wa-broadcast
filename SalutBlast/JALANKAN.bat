@echo off
title WA Blast - Salut Etam Betuah
color 0A
echo.
echo ================================================
echo   WA BLAST - SALUT ETAM BETUAH
echo   #KuliahTerurus #KerjaJalanTerus
echo ================================================
echo.

:: Pastikan di folder yang benar
cd /d "%~dp0"
echo [1/4] Folder: %CD%
echo.

:: Download file terbaru dari GitHub
echo [2/4] Download file terbaru...
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/index.js" -o index.js
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/package.json" -o package.json
echo     Selesai download.
echo.

:: Hapus node_modules lama jika ada error sebelumnya
if exist node_modules\@whiskeysockets (
    echo [3/4] Modul sudah ada, skip install.
) else (
    echo [3/4] Install modul (tunggu 2-5 menit)...
    call npm install --legacy-peer-deps
    echo.
)

:: Cek message.xlsx ada
if not exist message.xlsx (
    echo.
    echo ERROR: File message.xlsx tidak ditemukan!
    echo Pastikan message.xlsx ada di folder yang sama.
    pause
    exit
)

:: Jalankan
echo [4/4] Menjalankan WA Blast...
echo.
echo ================================================
echo   Tunggu QR code muncul, lalu scan dengan WA
echo   Nomor: 0877 8379 4377
echo ================================================
echo.
node index.js

echo.
echo Selesai.
pause
