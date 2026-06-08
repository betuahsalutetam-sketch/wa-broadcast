/**
 * WA BLAST SALUT ETAM BETUAH - ESM Version
 * node index.mjs → scan QR → kirim otomatis
 */
import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import XLSX from 'xlsx';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ===== KONFIGURASI =====
const FILE_EXCEL  = 'message.xlsx';
const FILE_GAMBAR = 'flyer.png';
const JEDA_MIN    = 30;
const JEDA_MAX    = 60;
const MAKS_HARI   = 50;
const FILE_LOG    = 'log_terkirim.json';
// =======================

function bacaLeads() {
    if (!fs.existsSync(FILE_EXCEL)) {
        console.error(`\n❌ File ${FILE_EXCEL} tidak ada di folder ini!\n`);
        process.exit(1);
    }
    const wb = XLSX.readFile(FILE_EXCEL);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const leads = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row?.[0]) continue;
        let nomor = String(row[0]).replace(/\D/g, '');
        if (nomor.startsWith('0')) nomor = '62' + nomor.slice(1);
        else if (nomor.startsWith('8')) nomor = '62' + nomor;
        const pesan = row[1] ? String(row[1]) : '';
        if (nomor.length >= 10 && pesan)
            leads.push({ jid: nomor + '@s.whatsapp.net', pesan, raw: nomor });
    }
    return leads;
}

function bacaLog() {
    try { return new Set(JSON.parse(fs.readFileSync(FILE_LOG, 'utf8'))); }
    catch { return new Set(); }
}

function simpanLog(set) {
    fs.writeFileSync(FILE_LOG, JSON.stringify([...set]));
}

const delay = (s) => new Promise(r => setTimeout(r, s * 1000));

async function main() {
    console.log('\n' + '='.repeat(50));
    console.log('  WA BLAST — SALUT ETAM BETUAH');
    console.log('  #KuliahTerurus #KerjaJalanTerus');
    console.log('='.repeat(50));

    const leads    = bacaLeads();
    const terkirim = bacaLog();
    const sisa     = leads.filter(l => !terkirim.has(l.raw));
    const batch    = sisa.slice(0, MAKS_HARI);
    const adaGambar = fs.existsSync(FILE_GAMBAR);

    console.log(`\n📊 Total leads   : ${leads.length}`);
    console.log(`✅ Sudah terkirim: ${terkirim.size}`);
    console.log(`📤 Hari ini kirim: ${batch.length} dari ${sisa.length} sisa`);
    console.log(`🖼️  Flyer         : ${adaGambar ? 'flyer.png ✅' : 'tidak ada'}\n`);

    if (!batch.length) { console.log('🎉 Semua leads sudah terkirim!'); return; }

    const { state, saveCreds } = await useMultiFileAuthState('auth_salut');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false
    });

    let sudahKirim = false;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.clear();
            console.log('📱 SCAN QR INI dengan WhatsApp nomor 0877-8379-4377\n');
            qrcode.generate(qr, { small: true });
            console.log('\n(WA → titik 3 pojok → Perangkat Tertaut → Tautkan → Scan QR)\n');
        }

        if (connection === 'open' && !sudahKirim) {
            sudahKirim = true;
            console.log('\n✅ Terhubung! Mulai kirim pesan...\n');
            await delay(3);

            let ok = 0, err = 0;
            for (let i = 0; i < batch.length; i++) {
                const { jid, pesan, raw } = batch[i];
                try {
                    if (adaGambar) {
                        const img = fs.readFileSync(path.resolve(FILE_GAMBAR));
                        await sock.sendMessage(jid, { image: img, caption: pesan, mimetype: 'image/png' });
                    } else {
                        await sock.sendMessage(jid, { text: pesan });
                    }
                    terkirim.add(raw); simpanLog(terkirim); ok++;
                    console.log(`  ✅ [${i+1}/${batch.length}] ${raw}`);
                } catch(e) {
                    err++;
                    console.log(`  ❌ [${i+1}/${batch.length}] ${raw} — ${e.message}`);
                }
                if (i < batch.length - 1) {
                    const j = JEDA_MIN + Math.floor(Math.random() * (JEDA_MAX - JEDA_MIN));
                    console.log(`     ⏳ Jeda ${j} detik...`);
                    await delay(j);
                }
            }
            console.log('\n' + '='.repeat(50));
            console.log(`  SELESAI: ✅ ${ok} berhasil | ❌ ${err} gagal`);
            if (sisa.length > batch.length)
                console.log(`  📅 Sisa ${sisa.length - batch.length} leads → jalankan lagi besok`);
            console.log('='.repeat(50) + '\n');
            await sock.logout(); process.exit(0);
        }

        if (connection === 'close') {
            const code = lastDisconnect?.error instanceof Boom
                ? lastDisconnect.error.output.statusCode : 0;
            if (code !== DisconnectReason.loggedOut && !sudahKirim) {
                console.log('⚠️ Terputus, mencoba ulang...');
                main();
            }
        }
    });
}

main().catch(e => { console.error('\n❌ Error:', e.message, '\n'); process.exit(1); });
