/**
 * WA BLAST — SALUT ETAM BETUAH
 * Kirim pesan + gambar ke leads dari file Excel
 * Cara pakai: npm install → node index.js → scan QR
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// ===== KONFIGURASI =====
const FILE_EXCEL  = 'message.xlsx';   // file Excel leads
const FILE_GAMBAR = 'flyer.png';      // gambar flyer (kosongkan jika tidak ada)
const JEDA_MIN    = 30;               // jeda minimum antar pesan (detik)
const JEDA_MAX    = 60;               // jeda maksimum antar pesan (detik)
const MAKS_HARI   = 50;              // maksimal kirim per hari (aman = 50)
const FILE_LOG    = 'log_terkirim.json';
// =======================

function bacaLeads() {
    if (!fs.existsSync(FILE_EXCEL)) {
        console.error(`❌ File ${FILE_EXCEL} tidak ditemukan! Taruh di folder yang sama.`);
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
            leads.push({ nomor: nomor + '@c.us', pesan, raw: nomor });
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

function randomJeda() {
    return Math.floor(Math.random() * (JEDA_MAX - JEDA_MIN + 1)) + JEDA_MIN;
}

async function main() {
    console.log('='.repeat(55));
    console.log('  WA BLAST — SALUT ETAM BETUAH');
    console.log('  #KuliahTerurus #KerjaJalanTerus');
    console.log('='.repeat(55));

    const leads    = bacaLeads();
    const terkirim = bacaLog();
    const sisa     = leads.filter(l => !terkirim.has(l.raw));
    const batch    = sisa.slice(0, MAKS_HARI);

    console.log(`\n📊 Total leads   : ${leads.length}`);
    console.log(`✅ Sudah terkirim: ${terkirim.size}`);
    console.log(`📤 Sisa          : ${sisa.length}`);
    console.log(`▶️  Hari ini kirim: ${batch.length} (maks ${MAKS_HARI}/hari)\n`);

    if (batch.length === 0) {
        console.log('🎉 Semua leads sudah terkirim!'); return;
    }

    // Siapkan gambar
    let media = null;
    if (FILE_GAMBAR && fs.existsSync(FILE_GAMBAR)) {
        media = MessageMedia.fromFilePath(path.resolve(FILE_GAMBAR));
        console.log(`🖼️  Gambar: ${FILE_GAMBAR} ✅`);
    } else {
        console.log('ℹ️  Tanpa gambar (kirim teks saja)');
    }

    // Inisialisasi WhatsApp
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: 'salut-blast' }),
        puppeteer: { headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] }
    });

    client.on('qr', qr => {
        console.log('\n📱 SCAN QR INI dengan WhatsApp +62877...\n');
        qrcode.generate(qr, { small: true });
        console.log('\n(Buka WA → ⋮ → Perangkat Tertaut → Tautkan Perangkat → Scan QR)\n');
    });

    client.on('ready', async () => {
        console.log('\n✅ WhatsApp terhubung! Mulai kirim...\n');
        let berhasil = 0, gagal = 0;

        for (let i = 0; i < batch.length; i++) {
            const { nomor, pesan, raw } = batch[i];
            try {
                if (media) {
                    await client.sendMessage(nomor, media, { caption: pesan });
                } else {
                    await client.sendMessage(nomor, pesan);
                }
                terkirim.add(raw);
                simpanLog(terkirim);
                berhasil++;
                console.log(`  ✅ [${i+1}/${batch.length}] ${raw} — Terkirim`);
            } catch (err) {
                gagal++;
                console.log(`  ❌ [${i+1}/${batch.length}] ${raw} — Gagal: ${err.message}`);
            }

            if (i < batch.length - 1) {
                const j = randomJeda();
                console.log(`     ⏳ Jeda ${j} detik...`);
                await jeda(j);
            }
        }

        console.log('\n' + '='.repeat(55));
        console.log(`  SELESAI: ✅ ${berhasil} berhasil | ❌ ${gagal} gagal`);
        if (sisa.length - batch.length > 0)
            console.log(`  📅 Sisa ${sisa.length - batch.length} leads — jalankan lagi besok`);
        console.log('='.repeat(55));
        await client.destroy();
        process.exit(0);
    });

    client.on('auth_failure', () => {
        console.error('❌ Autentikasi gagal — hapus folder .wwebjs_auth dan coba lagi');
        process.exit(1);
    });

    client.on('disconnected', () => {
        console.log('⚠️  WhatsApp terputus'); process.exit(1);
    });

    console.log('🔄 Memulai WhatsApp, tunggu QR code...\n');
    client.initialize();
}

main().catch(err => {
    console.error('Error fatal:', err.message);
    process.exit(1);
});
