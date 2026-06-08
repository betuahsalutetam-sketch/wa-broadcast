/**
 * WA BLAST SALUT ETAM BETUAH
 * Pakai Baileys — ringan, tanpa Chrome, tanpa Git dependency
 * Cara pakai: npm install → node index.js → scan QR
 */

const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const qrcode = require('qrcode-terminal');
const XLSX = require('xlsx');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// ===== KONFIGURASI =====
const FILE_EXCEL  = 'message.xlsx';
const FILE_GAMBAR = 'flyer.png';
const JEDA_MIN    = 30;   // detik
const JEDA_MAX    = 60;   // detik
const MAKS_HARI   = 50;   // maksimal kirim per hari
const FILE_LOG    = 'log_terkirim.json';
// =======================

function bacaLeads() {
    if (!fs.existsSync(FILE_EXCEL)) {
        console.error(`❌ File ${FILE_EXCEL} tidak ditemukan!`);
        process.exit(1);
    }
    const wb = XLSX.readFile(FILE_EXCEL);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const leads = [];
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[0]) continue;
        let nomor = String(row[0]).replace(/\D/g, '');
        if (!nomor.startsWith('62')) nomor = '62' + nomor.replace(/^0/, '');
        const pesan = row[1] ? String(row[1]) : '';
        if (nomor.length >= 10 && pesan) {
            leads.push({ jid: nomor + '@s.whatsapp.net', pesan, raw: nomor });
        }
    }
    return leads;
}

function bacaLog() {
    if (!fs.existsSync(FILE_LOG)) return new Set();
    try { return new Set(JSON.parse(fs.readFileSync(FILE_LOG, 'utf8'))); }
    catch { return new Set(); }
}

function simpanLog(set) {
    fs.writeFileSync(FILE_LOG, JSON.stringify([...set]));
}

function jeda(detik) {
    return new Promise(r => setTimeout(r, detik * 1000));
}

async function kirimSemua(sock, batch, terkirim, adaGambar) {
    let berhasil = 0, gagal = 0;
    for (let i = 0; i < batch.length; i++) {
        const { jid, pesan, raw } = batch[i];
        try {
            if (adaGambar) {
                const gambar = fs.readFileSync(path.resolve(FILE_GAMBAR));
                await sock.sendMessage(jid, {
                    image: gambar,
                    caption: pesan,
                    mimetype: 'image/png'
                });
            } else {
                await sock.sendMessage(jid, { text: pesan });
            }
            terkirim.add(raw);
            simpanLog(terkirim);
            berhasil++;
            console.log(`  ✅ [${i+1}/${batch.length}] ${raw}`);
        } catch (err) {
            gagal++;
            console.log(`  ❌ [${i+1}/${batch.length}] ${raw} — ${err.message}`);
        }

        if (i < batch.length - 1) {
            const j = Math.floor(Math.random() * (JEDA_MAX - JEDA_MIN + 1)) + JEDA_MIN;
            console.log(`     ⏳ Jeda ${j} detik...`);
            await jeda(j);
        }
    }
    return { berhasil, gagal };
}

async function main() {
    console.log('='.repeat(50));
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
    console.log(`📤 Hari ini kirim: ${batch.length}`);
    console.log(`🖼️  Gambar flyer  : ${adaGambar ? '✅' : '❌ tidak ada'}\n`);

    if (batch.length === 0) {
        console.log('🎉 Semua leads sudah terkirim!'); return;
    }

    const { state, saveCreds } = await useMultiFileAuthState('auth_salut');
    const logger = pino({ level: 'silent' });

    const sock = makeWASocket({ auth: state, logger, printQRInTerminal: false });

    let kirimDone = false;

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('\n📱 SCAN QR INI dengan WhatsApp Anda:\n');
            qrcode.generate(qr, { small: true });
            console.log('\n(WA → ⋮ → Perangkat Tertaut → Tautkan Perangkat → Scan)\n');
        }

        if (connection === 'open' && !kirimDone) {
            kirimDone = true;
            console.log('✅ WhatsApp terhubung! Mulai kirim...\n');
            await jeda(3);

            const { berhasil, gagal } = await kirimSemua(sock, batch, terkirim, adaGambar);

            console.log('\n' + '='.repeat(50));
            console.log(`  SELESAI: ✅ ${berhasil} berhasil | ❌ ${gagal} gagal`);
            if (sisa.length - batch.length > 0)
                console.log(`  📅 Sisa ${sisa.length - batch.length} — jalankan lagi besok`);
            console.log('='.repeat(50));
            await sock.logout();
            process.exit(0);
        }

        if (connection === 'close') {
            const code = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode : 0;
            if (code !== DisconnectReason.loggedOut && !kirimDone) {
                console.log('⚠️ Terputus, coba lagi...');
                main();
            } else {
                console.log('Selesai.'); process.exit(0);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
