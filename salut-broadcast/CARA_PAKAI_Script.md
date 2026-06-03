# Cara Pakai Script Kirim WA — Salut Etam Betuah

## 📋 Yang Dibutuhkan
- Komputer/laptop dengan **Python 3** terinstall (cek: ketik `python3 --version`)
- File `kirim_wa_salut.py` + `Leads_UT_Bersih_746.xlsx` di folder yang sama
- TOKEN & PHONE_NUMBER_ID dari WhatsApp Manager

## 🔧 Langkah Setup (sekali saja)

### 1. Install modul Excel
```
pip install openpyxl
```

### 2. Dapatkan TOKEN & PHONE_NUMBER_ID dari Meta
- Buka **developers.facebook.com** → App Anda → WhatsApp → **API Setup**
- Salin **Phone number ID** (angka panjang)
- Buat **Permanent Token**:
  - Business Settings → System Users → Add → buat user "Admin"
  - Generate Token → centang izin: `whatsapp_business_messaging` + `whatsapp_business_management`
  - Salin token (token sementara hanya 24 jam, WAJIB pakai yang permanen)

### 3. Daftarkan Template
- WhatsApp Manager → Message Templates → Create
- Nama: `info_ut_pertama` (atau sesuai selera, lalu update di script)
- Kategori: **Marketing** | Bahasa: **Indonesia**
- Isi body dengan `{{1}}` di tempat nama, contoh:
  ```
  Apa kabar Kak {{1}} 👋
  Perkenalkan, kami dari SALUT Etam Betuah...
  (teks lengkap dari file Template kemarin)
  ```
- Submit → tunggu approval Meta (~1-2 jam)

### 4. Edit script
Buka `kirim_wa_salut.py` dengan Notepad/text editor, isi bagian KONFIGURASI:
```python
TOKEN           = "EAAxxxxx..."        # token permanen Anda
PHONE_NUMBER_ID = "123456789..."       # phone number ID
TEMPLATE_NAME   = "info_ut_pertama"    # nama template yang di-approve
DRY_RUN         = True                 # biarkan True untuk tes dulu
```

## 🧪 Tes Dulu (WAJIB)
1. Pastikan `DRY_RUN = True`
2. Jalankan: `python3 kirim_wa_salut.py`
3. Lihat apakah membaca leads & nama dengan benar (tidak benar-benar kirim)

## 🚀 Kirim Sungguhan
1. Ubah `DRY_RUN = False`
2. Jalankan: `python3 kirim_wa_salut.py`
3. Tekan ENTER → script kirim max 250/hari dengan jeda otomatis
4. **Besok jalankan lagi** → otomatis lanjut ke yang belum terkirim

## 🛡️ Fitur Aman Bawaan
- ✅ Limit 250/hari (sesuai aturan Meta Tier 0)
- ✅ Jeda acak 30-90 detik antar pesan (anti-spam-detection alami)
- ✅ Bisa lanjut — yang sudah terkirim tidak diulang (`log_terkirim.csv`)
- ✅ Bisa di-stop kapan saja (Ctrl+C), progress tersimpan
- ✅ Catat semua hasil di `log_terkirim.csv`

## 📈 Setelah Verifikasi Bisnis Selesai
Ubah di script: `LIMIT_PER_HARI = 1000` (limit naik otomatis dari Meta)

## ⚠️ Penting
- Jangan ubah `JEDA_MIN`/`JEDA_MAX` jadi terlalu kecil — jeda inilah yang menjaga nomor tetap aman
- Mulai dari leads paling baru (file sudah urut)
- Kalau ada yang balas → respons cepat (gratis & konversi tinggi)
- Sediakan template follow-up untuk yang belum balas (lihat file Template kemarin)
