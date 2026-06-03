# 📱 Cara Buka Aplikasi WA Blast

## Yang Anda dapat
**`app_wa_blast.py`** — aplikasi dengan tampilan jendela (ada kolom isian, tombol, progress bar). Bukan edit kode lagi — tinggal klik!

---

## 🪟 WINDOWS

### Langkah sekali saja:
1. Install **Python**: buka python.org/downloads → Download → saat install **CENTANG "Add Python to PATH"**
2. Buka **Command Prompt** (ketik `cmd` di Start) → ketik:
   ```
   pip install openpyxl
   ```

### Buka aplikasi:
- **Double-click** file `app_wa_blast.py`
- Jendela aplikasi langsung muncul! 🎉

> Kalau double-click tidak terbuka: klik kanan file → Open with → Python

---

## 🍎 MAC

1. Python biasanya sudah ada. Buka **Terminal** → ketik:
   ```
   pip3 install openpyxl
   ```
2. Jalankan aplikasi:
   ```
   python3 /path/ke/app_wa_blast.py
   ```
   (atau drag file ke Terminal setelah ketik `python3 `)

---

## 🖱️ Cara Pakai Aplikasi (di dalam jendela)

```
┌─────────────────────────────────────────┐
│  📱 WA BLAST — SALUT ETAM BETUAH         │
├─────────────────────────────────────────┤
│ 1️⃣ Kredensial Meta                       │
│    Access Token:    [_______________]    │  ← tempel token baru
│    Phone Number ID: [_______________]    │  ← dari API Setup
│    Nama Template:   [info_ut_pertama ]    │
│                                           │
│ 2️⃣ File Data Leads                        │
│    [______________]  [📂 Pilih File]      │  ← pilih Excel
│                                           │
│ 3️⃣ Pengaturan Aman                        │
│    Limit/hari:[250] Jeda:[30]-[90] detik  │
│                                           │
│ ☑ Mode Tes (cek dulu tanpa kirim)         │
│                                           │
│  [🔍 Cek File] [🚀 MULAI KIRIM] [⏹ STOP]  │
│  ▓▓▓▓▓▓░░░░░░░░ progress bar               │
│                                           │
│  📋 Log Aktivitas                         │
│  [00:01] ✅ Admin 1 (628***) terkirim     │
└─────────────────────────────────────────┘
```

### Urutan klik:
1. **Isi** Token + Phone Number ID + Nama Template
2. **Klik "📂 Pilih File"** → pilih `tes.xlsx` (untuk tes ke admin dulu)
3. **Centang "Mode Tes"** → klik **"🔍 Cek File"** → pastikan terbaca
4. **Hilangkan centang "Mode Tes"** → klik **"🚀 MULAI KIRIM"** → cek WA admin!
5. Kalau pesan masuk ✅ → ganti file ke `Leads_UT_Bersih_746.xlsx` → KIRIM
6. Klik **"💾 Simpan Setelan"** agar tidak isi ulang besok

### Fitur:
- ✅ Limit 250/hari + jeda otomatis (aman dari banned)
- ✅ Bisa lanjut besok (yang terkirim tidak diulang)
- ✅ Tombol STOP kapan saja
- ✅ Progress bar + log langsung terlihat

---

## ⚠️ Syarat Sebelum Kirim Sungguhan
1. Template di Meta sudah berstatus **"Approved"**
2. Token **BARU** (yang lama sudah bocor di chat)
3. Untuk tes: nomor admin sudah didaftarkan di "To list" Meta (lihat panduan LANGKAH_LENGKAP)

Kalau muncul error code → kirim ke Claude, ada tabel artinya di panduan lengkap.
