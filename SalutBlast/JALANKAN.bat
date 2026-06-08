@echo off
title WA Blast - Salut Etam Betuah
color 0A

cd /d "%~dp0"

echo.
echo ================================================
echo   WA BLAST - SALUT ETAM BETUAH
echo   #KuliahTerurus #KerjaJalanTerus  
echo ================================================
echo.

echo [1] Cek Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js tidak ditemukan! Install dari nodejs.org
    pause
    exit /b
)

echo [2] Download file terbaru dari GitHub...
curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/index.js" -o index_baru.js
if exist index_baru.js (
    move /y index_baru.js index.js >nul
    echo     index.js diperbarui
) else (
    echo     Gagal download, pakai file lokal
)

curl -s -L "https://raw.githubusercontent.com/betuahsalutetam-sketch/wa-broadcast/main/SalutBlast/package.json" -o package_baru.json
if exist package_baru.json (
    move /y package_baru.json package.json >nul
    echo     package.json diperbarui
)

echo.
echo [3] Install modul (tunggu 2-5 menit)...
if exist node_modules\@whiskeysockets (
    echo     Modul sudah ada, skip install
) else (
    npm install --legacy-peer-deps
    if errorlevel 1 (
        echo.
        echo ERROR saat npm install!
        echo Coba ketik: npm install --legacy-peer-deps
        pause
        exit /b
    )
)

echo.
if not exist message.xlsx (
    echo ERROR: message.xlsx tidak ada di folder ini!
    echo Pastikan file message.xlsx ada di: %CD%
    pause
    exit /b
)

echo [4] Menjalankan WA Blast...
echo.
echo ================================================
echo   QR code akan muncul di bawah ini
echo   Buka WA 0877-8379-4377 dan scan QR
echo ================================================
echo.

node index.js

echo.
echo ================================================
echo   Selesai! Tekan tombol apapun untuk keluar.
echo ================================================
pause
