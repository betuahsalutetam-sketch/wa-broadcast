import { makeWASocket, DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import XLSX from 'xlsx';
import pino from 'pino';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FILE_EXCEL  = 'message.xlsx';
const FILE_GAMBAR = 'flyer.png';
const JEDA_MIN    = 30;
const JEDA_MAX    = 60;
const MAKS_HARI   = 50;
const FILE_LOG    = 'log_terkirim.json';

function bacaLeads() {
    if (!fs.existsSync(FILE_EXCEL)) {
        console.error(`\n❌ File ${FILE_EXCEL} tidak ada!\n`); process.exit(1);
    }
    const wb = XLSX.readFile(FILE_EXCEL);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const leads = [];
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row?.[0]) continue;
        let no = String(row[0]).replace(/\D/g, '');
        if (no.startsWith('0')) no = '62' + no.slice(1);
        else if (no.startsWith('8')) no = '62' + no;
        const pesan = row[1] ? String(row[1]) : '';
        if (no.length >= 10 && pesan)
            leads.push({ jid: no + '@s.whatsapp.net', pesan, raw: no });
    }
    return leads;
}

function bacaLog() {
    try { return new Set(JSON.parse(fs.readFileSync(FILE_LOG, 'utf8'))); }
    catch { return new Set(); }
}
function simpanLog(s) { fs.writeFileSync(FILE_LOG, JSON.stringify([...s])); }
const delay = s => new Promise(r => setTimeout(r, s * 1000));

async function main() {
    console.log('\n================================================');
    console.log('  WA BLAST — SALUT ETAM BETUAH');
    console.log('================================================\n');

    const leads    = bacaLeads();
    const terkirim = bacaLog();
    const sisa     = leads.filter(l => !terkirim.has(l.raw));
    const batch    = sisa.slice(0, MAKS_HARI);
    const adaGambar = fs.existsSync(FILE_GAMBAR);

    console.log(`Total leads   : ${leads.length}`);
    console.log(`Sudah terkirim: ${terkirim.size}`);
    console.log(`Hari ini kirim: ${batch.length}`);
    console.log(`Flyer         : ${adaGambar ? 'Ada ✅' : 'Tidak ada'}\n`);

    if (!batch.length) { console.log('Semua leads sudah terkirim!'); return; }

    // Hapus auth lama jika ada masalah
    const AUTH_DIR = 'auth_salut';

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    console.log('Menghubungkan ke WhatsApp...\n');

    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,  // Tampilkan QR langsung di terminal
        browser: ['Salut Blast', 'Chrome', '1.0.0'],
        connectTimeoutMs: 60000,
        retryRequestDelayMs: 2000,
        maxRetries: 3
    });

    sock.ev.on('creds.update', saveCreds);

    let qrMuncul = false;
    let sudahKirim = false;

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            qrMuncul = true;
            console.log('\n================================================');
            console.log('SCAN QR DI ATAS dengan WhatsApp 0877-8379-4377');
            console.log('WA → titik 3 → Perangkat Tertaut → Tautkan → Scan');
            console.log('================================================\n');
        }

        if (connection === 'open' && !sudahKirim) {
            sudahKirim = true;
            console.log('\n✅ Terhubung! Mulai kirim...\n');
            await delay(2);

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
                    console.log(`✅ [${i+1}/${batch.length}] ${raw}`);
                } catch(e) {
                    err++;
                    console.log(`❌ [${i+1}/${batch.length}] ${raw} — ${e.message}`);
                }
                if (i < batch.length - 1) {
                    const j = JEDA_MIN + Math.floor(Math.random() * (JEDA_MAX - JEDA_MIN));
                    console.log(`   Jeda ${j} detik...`);
                    await delay(j);
                }
            }

            console.log('\n================================================');
            console.log(`SELESAI: ${ok} berhasil | ${err} gagal`);
            if (sisa.length > batch.length)
                console.log(`Sisa ${sisa.length - batch.length} leads → jalankan lagi besok`);
            console.log('================================================\n');
            process.exit(0);
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error instanceof Boom
                ? lastDisconnect.error.output.statusCode : 500;

            console.log(`Koneksi terputus (kode: ${statusCode})`);

            if (statusCode === DisconnectReason.loggedOut) {
                console.log('Logout. Hapus folder auth_salut dan coba lagi.');
                process.exit(1);
            }

            if (!sudahKirim && statusCode !== 428) {
                console.log('Mencoba ulang dalam 5 detik...');
                await delay(5);
                // Bersihkan sock lama
                try { sock.end(); } catch(_) {}
                main();
            }
        }
    });
}

main().catch(e => {
    console.error('\n❌ Error fatal:', e.message, '\n');
    process.exit(1);
});
