# WA Blast Salut Etam Betuah

## Cara pakai (Windows)

1. Taruh 3 file ini di 1 folder:
   - `message.xlsx` (download dari Claude)
   - `flyer.png` (download dari Claude)
   - Semua file dari folder ini

2. Buka CMD di folder itu → ketik:
   ```
   npm install
   ```

3. Setelah selesai, ketik:
   ```
   node index.js
   ```

4. Scan QR dengan WhatsApp di HP

5. Tunggu — pesan terkirim otomatis!

## Pengaturan aman (di index.js baris atas)
- MAKS_HARI = 50 (kirim maks 50/hari)
- JEDA_MIN = 30, JEDA_MAX = 60 (jeda 30-60 detik)
