#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================
  APLIKASI WA BLAST — SALUT ETAM BETUAH
  Tampilan klik (GUI) · WhatsApp Cloud API Resmi · Aman
================================================================
Cara jalankan:
  - Pastikan Python 3 terinstall
  - Double-click file ini, ATAU ketik: python3 app_wa_blast.py
  - (Tkinter sudah bawaan Python, tidak perlu install apa-apa)
  - Untuk baca Excel: pip install openpyxl
================================================================
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
import json
import time
import random
import csv
import os
import urllib.request
import urllib.error

CONFIG_FILE = "config_wa.json"
LOG_FILE = "log_terkirim.csv"


class WABlastApp:
    def __init__(self, root):
        self.root = root
        self.root.title("WA Blast — Salut Etam Betuah")
        self.root.geometry("780x780")
        self.root.configure(bg="#0F172A")
        self.stop_flag = False
        self.leads = []

        # ===== HEADER =====
        header = tk.Frame(root, bg="#1E3A8A", height=70)
        header.pack(fill="x")
        tk.Label(header, text="📱 WA BLAST — SALUT ETAM BETUAH",
                 font=("Arial", 16, "bold"), bg="#1E3A8A", fg="white").pack(pady=8)
        tk.Label(header, text="WhatsApp Cloud API Resmi · Aman · #KuliahTerurus",
                 font=("Arial", 9), bg="#1E3A8A", fg="#FCD34D").pack()

        # ===== SCROLLABLE BODY =====
        main = tk.Frame(root, bg="#0F172A")
        main.pack(fill="both", expand=True, padx=16, pady=12)

        # --- Bagian 1: Kredensial ---
        self._section(main, "1️⃣  Kredensial Meta (dari WhatsApp Manager)")
        self.e_token = self._field(main, "Access Token:", "Tempel token permanen di sini")
        self.e_phoneid = self._field(main, "Phone Number ID:", "Contoh: 123456789012345")
        self.e_template = self._field(main, "Nama Template:", "info_ut_pertama")
        self.e_lang = self._field(main, "Bahasa Template:", "id")
        self.e_lang.delete(0, tk.END)
        self.e_lang.insert(0, "id")

        # --- Bagian 2: File Data ---
        self._section(main, "2️⃣  File Data Leads (Excel)")
        frame_file = tk.Frame(main, bg="#0F172A")
        frame_file.pack(fill="x", pady=4)
        self.e_file = tk.Entry(frame_file, font=("Arial", 10), bg="#1E293B", fg="white",
                               insertbackground="white", relief="flat")
        self.e_file.pack(side="left", fill="x", expand=True, ipady=6, padx=(0, 8))
        tk.Button(frame_file, text="📂 Pilih File", command=self.pilih_file,
                  bg="#2563EB", fg="white", font=("Arial", 10, "bold"),
                  relief="flat", padx=14, cursor="hand2").pack(side="right")

        # --- Bagian 3: Pengaturan Aman ---
        self._section(main, "3️⃣  Pengaturan Aman")
        frame_set = tk.Frame(main, bg="#0F172A")
        frame_set.pack(fill="x", pady=4)

        tk.Label(frame_set, text="Limit/hari:", bg="#0F172A", fg="#94A3B8",
                 font=("Arial", 9)).grid(row=0, column=0, sticky="w", padx=4)
        self.e_limit = tk.Entry(frame_set, width=8, bg="#1E293B", fg="white",
                                insertbackground="white", relief="flat", justify="center")
        self.e_limit.insert(0, "250")
        self.e_limit.grid(row=0, column=1, padx=4, ipady=3)

        tk.Label(frame_set, text="Jeda min (detik):", bg="#0F172A", fg="#94A3B8",
                 font=("Arial", 9)).grid(row=0, column=2, sticky="w", padx=4)
        self.e_jmin = tk.Entry(frame_set, width=6, bg="#1E293B", fg="white",
                               insertbackground="white", relief="flat", justify="center")
        self.e_jmin.insert(0, "30")
        self.e_jmin.grid(row=0, column=3, padx=4, ipady=3)

        tk.Label(frame_set, text="Jeda max (detik):", bg="#0F172A", fg="#94A3B8",
                 font=("Arial", 9)).grid(row=0, column=4, sticky="w", padx=4)
        self.e_jmax = tk.Entry(frame_set, width=6, bg="#1E293B", fg="white",
                               insertbackground="white", relief="flat", justify="center")
        self.e_jmax.insert(0, "90")
        self.e_jmax.grid(row=0, column=5, padx=4, ipady=3)

        # Mode tes
        self.var_dryrun = tk.BooleanVar(value=True)
        tk.Checkbutton(main, text="🧪 Mode Tes (DRY RUN — tidak benar-benar kirim, untuk cek dulu)",
                       variable=self.var_dryrun, bg="#0F172A", fg="#FCD34D",
                       selectcolor="#1E293B", font=("Arial", 9, "bold"),
                       activebackground="#0F172A", activeforeground="#FCD34D").pack(anchor="w", pady=6)

        # --- Tombol Aksi ---
        frame_btn = tk.Frame(main, bg="#0F172A")
        frame_btn.pack(fill="x", pady=8)
        tk.Button(frame_btn, text="🔍 Cek File", command=self.cek_file,
                  bg="#475569", fg="white", font=("Arial", 10, "bold"),
                  relief="flat", padx=16, pady=8, cursor="hand2").pack(side="left", padx=4)
        self.btn_kirim = tk.Button(frame_btn, text="🚀 MULAI KIRIM", command=self.mulai_kirim,
                                   bg="#16A34A", fg="white", font=("Arial", 11, "bold"),
                                   relief="flat", padx=24, pady=8, cursor="hand2")
        self.btn_kirim.pack(side="left", padx=4)
        self.btn_stop = tk.Button(frame_btn, text="⏹ STOP", command=self.stop_kirim,
                                  bg="#DC2626", fg="white", font=("Arial", 10, "bold"),
                                  relief="flat", padx=16, pady=8, cursor="hand2", state="disabled")
        self.btn_stop.pack(side="left", padx=4)
        tk.Button(frame_btn, text="💾 Simpan Setelan", command=self.simpan_config,
                  bg="#0EA5E9", fg="white", font=("Arial", 9, "bold"),
                  relief="flat", padx=12, pady=8, cursor="hand2").pack(side="right", padx=4)

        # --- Progress ---
        self.progress = ttk.Progressbar(main, mode="determinate")
        self.progress.pack(fill="x", pady=(6, 2))
        self.lbl_status = tk.Label(main, text="Siap. Isi kredensial & pilih file untuk mulai.",
                                   bg="#0F172A", fg="#94A3B8", font=("Arial", 9))
        self.lbl_status.pack(anchor="w")

        # --- Log ---
        self._section(main, "📋 Log Aktivitas")
        self.log_box = scrolledtext.ScrolledText(main, height=10, bg="#1E293B", fg="#E2E8F0",
                                                  font=("Consolas", 9), relief="flat", wrap="word")
        self.log_box.pack(fill="both", expand=True, pady=4)

        self.muat_config()
        self.log("Aplikasi siap. Pastikan template sudah 'Approved' di Meta sebelum kirim.")
        self.log("TIPS: Centang 'Mode Tes' dulu, lalu klik 'Cek File' untuk memastikan data terbaca.")

    # ========= UI Helpers =========
    def _section(self, parent, text):
        tk.Label(parent, text=text, bg="#0F172A", fg="#FCD34D",
                 font=("Arial", 11, "bold")).pack(anchor="w", pady=(12, 4))

    def _field(self, parent, label, placeholder):
        tk.Label(parent, text=label, bg="#0F172A", fg="#CBD5E1",
                 font=("Arial", 9)).pack(anchor="w")
        e = tk.Entry(parent, font=("Arial", 10), bg="#1E293B", fg="white",
                     insertbackground="white", relief="flat")
        e.pack(fill="x", ipady=6, pady=(2, 6))
        e.insert(0, placeholder)
        e.config(fg="#64748B")
        def on_focus_in(ev):
            if e.get() == placeholder:
                e.delete(0, tk.END); e.config(fg="white")
        def on_focus_out(ev):
            if not e.get():
                e.insert(0, placeholder); e.config(fg="#64748B")
        e.bind("<FocusIn>", on_focus_in)
        e.bind("<FocusOut>", on_focus_out)
        return e

    def log(self, msg):
        self.log_box.insert(tk.END, f"[{time.strftime('%H:%M:%S')}] {msg}\n")
        self.log_box.see(tk.END)
        self.root.update_idletasks()

    def set_status(self, msg):
        self.lbl_status.config(text=msg)
        self.root.update_idletasks()

    # ========= Config =========
    def simpan_config(self):
        cfg = {
            "token": self.e_token.get(), "phoneid": self.e_phoneid.get(),
            "template": self.e_template.get(), "lang": self.e_lang.get(),
            "file": self.e_file.get(), "limit": self.e_limit.get(),
            "jmin": self.e_jmin.get(), "jmax": self.e_jmax.get(),
        }
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(cfg, f)
            self.log("✅ Setelan disimpan (kecuali akan diisi ulang saat dibuka lagi).")
            messagebox.showinfo("Tersimpan", "Setelan berhasil disimpan.")
        except Exception as e:
            self.log(f"❌ Gagal simpan: {e}")

    def muat_config(self):
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE) as f:
                    cfg = json.load(f)
                for entry, key in [(self.e_token, "token"), (self.e_phoneid, "phoneid"),
                                   (self.e_template, "template"), (self.e_lang, "lang"),
                                   (self.e_file, "file"), (self.e_limit, "limit"),
                                   (self.e_jmin, "jmin"), (self.e_jmax, "jmax")]:
                    if cfg.get(key):
                        entry.delete(0, tk.END); entry.insert(0, cfg[key]); entry.config(fg="white")
            except Exception:
                pass

    def pilih_file(self):
        path = filedialog.askopenfilename(title="Pilih file Excel leads",
                                          filetypes=[("Excel", "*.xlsx *.xls")])
        if path:
            self.e_file.delete(0, tk.END)
            self.e_file.insert(0, path)
            self.e_file.config(fg="white")

    # ========= Baca Excel =========
    def baca_excel(self):
        try:
            import openpyxl
        except ImportError:
            messagebox.showerror("Modul kurang", "Jalankan dulu di Terminal/CMD:\n\npip install openpyxl")
            return None
        path = self.e_file.get()
        if not path or not os.path.exists(path):
            messagebox.showerror("File", "File Excel belum dipilih atau tidak ditemukan.")
            return None
        wb = openpyxl.load_workbook(path, read_only=True)
        ws = wb.active
        leads = []
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0 or not row or len(row) < 2:
                continue
            nama = str(row[0]).strip() if row[0] else "Kak"
            nomor = "".join(c for c in str(row[1]) if c.isdigit()) if row[1] else ""
            if len(nomor) >= 10:
                leads.append((nama, nomor))
        wb.close()
        return leads

    def cek_file(self):
        leads = self.baca_excel()
        if leads is None:
            return
        self.leads = leads
        self.log(f"✅ File terbaca: {len(leads)} nomor valid.")
        if leads:
            self.log(f"   Contoh: {leads[0][0]} ({leads[0][1][:5]}***)")
        self.set_status(f"{len(leads)} leads siap dikirim.")

    # ========= Kirim =========
    def sudah_terkirim(self):
        s = set()
        if os.path.exists(LOG_FILE):
            with open(LOG_FILE, newline="", encoding="utf-8") as f:
                for r in csv.reader(f):
                    if len(r) >= 3 and r[2] == "BERHASIL":
                        s.add(r[1])
        return s

    def catat(self, nama, nomor, status, ket=""):
        baru = not os.path.exists(LOG_FILE)
        with open(LOG_FILE, "a", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            if baru:
                w.writerow(["waktu", "nomor", "status", "nama", "keterangan"])
            w.writerow([time.strftime("%Y-%m-%d %H:%M:%S"), nomor, status, nama, ket])

    def kirim_satu(self, nama, nomor):
        if self.var_dryrun.get():
            return True, "DRY_RUN"
        payload = {
            "messaging_product": "whatsapp", "to": nomor, "type": "template",
            "template": {
                "name": self.e_template.get(),
                "language": {"code": self.e_lang.get()},
                "components": [{"type": "body",
                                "parameters": [{"type": "text", "text": nama}]}]
            }
        }
        url = f"https://graph.facebook.com/v21.0/{self.e_phoneid.get()}/messages"
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Authorization", f"Bearer {self.e_token.get()}")
        req.add_header("Content-Type", "application/json")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                h = json.loads(resp.read().decode("utf-8"))
                return True, h.get("messages", [{}])[0].get("id", "?")
        except urllib.error.HTTPError as e:
            return False, f"HTTP {e.code}: {e.read().decode('utf-8','ignore')[:150]}"
        except Exception as e:
            return False, str(e)

    def mulai_kirim(self):
        if not self.leads:
            self.cek_file()
            if not self.leads:
                return
        if not self.var_dryrun.get():
            if self.e_token.get().startswith(("Tempel", "")) or len(self.e_token.get()) < 20:
                messagebox.showerror("Token", "Access Token belum diisi dengan benar.")
                return
            ok = messagebox.askyesno("Konfirmasi",
                f"MODE SUNGGUHAN!\nAkan kirim pesan ke {min(len(self.leads), int(self.e_limit.get()))} nomor.\n\nLanjutkan?")
            if not ok:
                return
        self.stop_flag = False
        self.btn_kirim.config(state="disabled")
        self.btn_stop.config(state="normal")
        threading.Thread(target=self._proses_kirim, daemon=True).start()

    def stop_kirim(self):
        self.stop_flag = True
        self.log("⏹ Permintaan stop... menyelesaikan pesan terakhir.")

    def _proses_kirim(self):
        try:
            terkirim = self.sudah_terkirim()
            sisa = [(n, no) for n, no in self.leads if no not in terkirim]
            limit = int(self.e_limit.get())
            jmin, jmax = int(self.e_jmin.get()), int(self.e_jmax.get())
            batch = sisa[:limit]

            self.log(f"📤 Total {len(self.leads)} | sudah {len(terkirim)} | sisa {len(sisa)}")
            self.log(f"▶️ Kirim {len(batch)} hari ini" + (" (MODE TES)" if self.var_dryrun.get() else ""))
            self.progress["maximum"] = len(batch)
            self.progress["value"] = 0

            berhasil = gagal = 0
            for idx, (nama, nomor) in enumerate(batch, 1):
                if self.stop_flag:
                    self.log("⏹ Dihentikan. Progress tersimpan.")
                    break
                sukses, ket = self.kirim_satu(nama, nomor)
                if sukses:
                    berhasil += 1
                    self.log(f"  ✅ [{idx}/{len(batch)}] {nama} ({nomor[:5]}***)")
                else:
                    gagal += 1
                    self.log(f"  ❌ [{idx}/{len(batch)}] {nama} — {ket}")
                self.catat(nama, nomor, "BERHASIL" if sukses else "GAGAL", ket)
                self.progress["value"] = idx
                self.set_status(f"Terkirim {berhasil} | Gagal {gagal} | Sisa {len(batch)-idx}")
                if idx < len(batch) and not self.stop_flag:
                    time.sleep(0.2 if self.var_dryrun.get() else random.randint(jmin, jmax))

            self.log(f"🎉 SELESAI: ✅ {berhasil} berhasil | ❌ {gagal} gagal")
            sisa_besok = len(sisa) - len(batch)
            if sisa_besok > 0 and not self.stop_flag:
                self.log(f"📅 Sisa {sisa_besok} leads — buka & klik KIRIM lagi besok untuk lanjut.")
        except Exception as e:
            self.log(f"❌ Error: {e}")
        finally:
            self.btn_kirim.config(state="normal")
            self.btn_stop.config(state="disabled")


if __name__ == "__main__":
    root = tk.Tk()
    app = WABlastApp(root)
    root.mainloop()
