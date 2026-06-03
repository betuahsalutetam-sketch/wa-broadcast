#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================
  KIRIM WA BROADCAST — SALUT ETAM BETUAH
  via WhatsApp Cloud API (RESMI Meta — aman, tidak banned)
================================================================

Cara pakai:
  1. Isi bagian KONFIGURASI di bawah (TOKEN, PHONE_NUMBER_ID, TEMPLATE_NAME)
  2. Pastикan file Excel leads ada di folder yang sama
  3. Jalankan: python3 kirim_wa_salut.py
  4. Coba dulu mode tes (DRY_RUN = True) sebelum kirim sungguhan

Fitur aman:
  - Limit 250 pesan/hari otomatis (sesuai aturan Meta Tier 0)
  - Jeda acak 30-90 detik antar pesan (meniru perilaku manusia)
  - Bisa lanjut kalau berhenti — yang sudah terkirim tidak dikirim ulang
  - Log lengkap ke file CSV
  - Mode tes (DRY_RUN) untuk cek tanpa benar-benar kirim
================================================================
"""

import json
import time
import random
import csv
import os
import sys
import urllib.request
import urllib.error

# ╔══════════════════════════════════════════════════════════╗
# ║                    KONFIGURASI                             ║
# ║         (ISI BAGIAN INI SEBELUM MENJALANKAN)               ║
# ╚══════════════════════════════════════════════════════════╝

# --- Kredensial dari Meta (WhatsApp Manager) ---
TOKEN           = "ISI_TOKEN_PERMANEN_ANDA_DISINI"      # Permanent token dari System User
PHONE_NUMBER_ID = "ISI_PHONE_NUMBER_ID_DISINI"          # Dari WhatsApp Manager > API Setup

# --- Template yang sudah di-approve Meta ---
TEMPLATE_NAME   = "info_ut_pertama"   # Nama template yang Anda daftarkan
TEMPLATE_LANG   = "id"                # Bahasa template (id = Indonesia)

# --- File data ---
FILE_LEADS      = "Leads_UT_Bersih_746.xlsx"  # File Excel leads
KOLOM_NAMA      = 0    # Kolom A = Nama (index 0)
KOLOM_NOMOR     = 1    # Kolom B = Nomor WhatsApp (index 1)

# --- Pengaturan aman ---
LIMIT_PER_HARI  = 250          # Maks 250/hari (Tier 0 belum verifikasi). Naikkan ke 1000 setelah verifikasi
JEDA_MIN        = 30           # Jeda minimum antar pesan (detik)
JEDA_MAX        = 90           # Jeda maksimum antar pesan (detik)
DRY_RUN         = True         # True = mode tes (tidak benar kirim). Ubah False untuk kirim sungguhan

# --- File log (jangan diubah) ---
FILE_LOG        = "log_terkirim.csv"

# ╔══════════════════════════════════════════════════════════╗
# ║              KODE PROGRAM (tidak perlu diubah)             ║
# ╚══════════════════════════════════════════════════════════╝

API_URL = f"https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages"


def baca_leads():
    """Baca file Excel, kembalikan list (nama, nomor)."""
    try:
        import openpyxl
    except ImportError:
        print("⚠️  Modul openpyxl belum ada. Jalankan: pip install openpyxl")
        sys.exit(1)

    if not os.path.exists(FILE_LEADS):
        print(f"❌ File '{FILE_LEADS}' tidak ditemukan di folder ini.")
        sys.exit(1)

    wb = openpyxl.load_workbook(FILE_LEADS, read_only=True)
    ws = wb.active
    leads = []
    for i, row in enumerate(ws.iter_rows(values_only=True)):
        if i == 0:
            continue  # lewati header
        if not row or len(row) <= max(KOLOM_NAMA, KOLOM_NOMOR):
            continue
        nama = str(row[KOLOM_NAMA]).strip() if row[KOLOM_NAMA] else "Kak"
        nomor = str(row[KOLOM_NOMOR]).strip() if row[KOLOM_NOMOR] else ""
        nomor = "".join(c for c in nomor if c.isdigit())
        if len(nomor) >= 10:
            leads.append((nama, nomor))
    wb.close()
    return leads


def sudah_terkirim():
    """Baca log, kembalikan set nomor yang sudah berhasil dikirim."""
    terkirim = set()
    if os.path.exists(FILE_LOG):
        with open(FILE_LOG, newline="", encoding="utf-8") as f:
            for r in csv.reader(f):
                if len(r) >= 3 and r[2] == "BERHASIL":
                    terkirim.add(r[1])
    return terkirim


def catat_log(nama, nomor, status, keterangan=""):
    """Catat hasil pengiriman ke CSV."""
    baru = not os.path.exists(FILE_LOG)
    with open(FILE_LOG, "a", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        if baru:
            w.writerow(["waktu", "nomor", "status", "nama", "keterangan"])
        w.writerow([time.strftime("%Y-%m-%d %H:%M:%S"), nomor, status, nama, keterangan])


def kirim_satu(nama, nomor):
    """Kirim satu pesan template via Cloud API. Kembalikan (sukses, keterangan)."""
    payload = {
        "messaging_product": "whatsapp",
        "to": nomor,
        "type": "template",
        "template": {
            "name": TEMPLATE_NAME,
            "language": {"code": TEMPLATE_LANG},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": nama}  # mengisi {{1}} di template
                    ]
                }
            ]
        }
    }

    if DRY_RUN:
        return True, "DRY_RUN (tidak benar dikirim)"

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(API_URL, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Content-Type", "application/json")

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            hasil = json.loads(resp.read().decode("utf-8"))
            msg_id = hasil.get("messages", [{}])[0].get("id", "?")
            return True, f"id={msg_id}"
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "ignore")
        return False, f"HTTP {e.code}: {body[:200]}"
    except Exception as e:
        return False, f"Error: {e}"


def main():
    print("=" * 60)
    print("  KIRIM WA BROADCAST — SALUT ETAM BETUAH")
    print("  via WhatsApp Cloud API (Resmi)")
    print("=" * 60)

    if DRY_RUN:
        print("🧪 MODE TES (DRY_RUN=True) — tidak ada pesan dikirim sungguhan")
    else:
        print("🚀 MODE SUNGGUHAN — pesan akan benar-benar dikirim!")

    if not DRY_RUN and (TOKEN.startswith("ISI_") or PHONE_NUMBER_ID.startswith("ISI_")):
        print("\n❌ TOKEN / PHONE_NUMBER_ID belum diisi. Edit bagian KONFIGURASI dulu.")
        sys.exit(1)

    leads = baca_leads()
    terkirim = sudah_terkirim()
    sisa = [(n, no) for n, no in leads if no not in terkirim]

    print(f"\n📊 Total leads      : {len(leads)}")
    print(f"✅ Sudah terkirim   : {len(terkirim)}")
    print(f"📤 Sisa belum kirim : {len(sisa)}")
    print(f"📅 Limit hari ini   : {LIMIT_PER_HARI}")

    if not sisa:
        print("\n🎉 Semua leads sudah terkirim. Selesai!")
        return

    batch = sisa[:LIMIT_PER_HARI]
    print(f"\n▶️  Akan kirim {len(batch)} pesan hari ini (jeda {JEDA_MIN}-{JEDA_MAX} detik antar pesan)")
    print(f"   Estimasi waktu: ~{len(batch) * (JEDA_MIN + JEDA_MAX) // 2 // 60} menit\n")

    input("Tekan ENTER untuk mulai (atau Ctrl+C untuk batal)... ")

    berhasil = gagal = 0
    for idx, (nama, nomor) in enumerate(batch, 1):
        sukses, ket = kirim_satu(nama, nomor)
        status = "BERHASIL" if sukses else "GAGAL"
        if sukses:
            berhasil += 1
            print(f"  [{idx}/{len(batch)}] ✅ {nama} ({nomor}) — {ket}")
        else:
            gagal += 1
            print(f"  [{idx}/{len(batch)}] ❌ {nama} ({nomor}) — {ket}")
        catat_log(nama, nomor, status, ket)

        # Jeda acak antar pesan (kecuali pesan terakhir)
        if idx < len(batch):
            jeda = random.randint(JEDA_MIN, JEDA_MAX)
            time.sleep(jeda if not DRY_RUN else 0.1)

    print("\n" + "=" * 60)
    print(f"  SELESAI HARI INI: ✅ {berhasil} berhasil | ❌ {gagal} gagal")
    sisa_besok = len(sisa) - len(batch)
    if sisa_besok > 0:
        print(f"  📅 Sisa {sisa_besok} leads — jalankan lagi besok untuk lanjut")
    else:
        print(f"  🎉 Semua leads sudah terkirim!")
    print(f"  📝 Detail tersimpan di: {FILE_LOG}")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⏹️  Dibatalkan. Progress tersimpan — bisa lanjut kapan saja.")
