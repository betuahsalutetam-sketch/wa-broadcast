/**
 * WA BLAST SALUT ETAM BETUAH v5
 * Fix: versi protokol WA terbaru (v4) + laporan_blast.csv per pesan + info nomor pengirim (v5)
 */
import { makeWASocket, DisconnectReason, useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
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
const FILE_LAPORAN = 'laporan_blast.csv';
const AUTH_DIR    = 'auth_salut';
const MAX_RETRY   = 3;

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
        const nama  = row[2] ? String(row[2]) : '';
        if (no.length >= 10 && pesan)
            leads.push({ jid: no + '@s.whatsapp.net', pesan, raw: no, nama });
    }
    return leads;
}

function bacaLog() {
    try { return new Set(JSON.parse(fs.readFileSync(FILE_LOG,'utf8'))); }
    catch { return new Set(); }
}
function simpanLog(s) { fs.writeFileSync(FILE_LOG, JSON.stringify([...s])); }
const delay = s => new Promise(r => setTimeout(r, s * 1000));

function csvEscape(v) {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
}
function tulisLaporan({ waktu, nomor, nama, status, keterangan }) {
    if (!fs.existsSync(FILE_LAPORAN)) {
        fs.writeFileSync(FILE_LAPORAN, 'waktu,nomor,nama,status,keterangan\n', 'utf8');
    }
    const baris = [waktu, nomor, nama, status, keterangan].map(csvEscape).join(',') + '\n';
    fs.appendFileSync(FILE_LAPORAN, baris, 'utf8');
}

async function jalankan(retryKe = 0) {
    if (retryKe >= MAX_RETRY) {
        console.log('\n❌ Gagal terhubung setelah 3 percobaan.');
        console.log('📋 Kemungkinan penyebab:');
        console.log('   • Nomor masih terdaftar sebagai Business API');
        console.log('   • Coba hapus folder auth_salut lalu jalankan ulang');
        console.log('   • Atau gunakan nomor WA lain untuk scan QR');
        process.exit(1);
    }

    const leads    = bacaLeads();
    const terkirim = bacaLog();
    const sisa     = leads.filter(l => !terkirim.has(l.raw));
    const batch    = sisa.slice(0, MAKS_HARI);
    const adaGambar = fs.existsSync(FILE_GAMBAR);

    if (retryKe === 0) {
        console.log('\n================================================');
        console.log('  WA BLAST — SALUT ETAM BETUAH v3');
        console.log('================================================');
        console.log(`\nTotal leads   : ${leads.length}`);
        console.log(`Sudah terkirim: ${terkirim.size}`);
        console.log(`Hari ini kirim: ${batch.length}`);
        console.log(`Flyer         : ${adaGambar ? 'Ada ✅' : 'Tidak ada'}\n`);
        if (!batch.length) { console.log('🎉 Semua leads sudah terkirim!'); return; }
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    // Coba 3 variasi browser fingerprint berdasarkan nomor retry
    const browserList = [
        Browsers.macOS('Safari'),
        Browsers.ubuntu('Chrome'),
        ['Windows', 'Chrome', '120.0.0'],
    ];
    const browser = browserList[retryKe % browserList.length];
    console.log(`\n🔄 Percobaan ${retryKe + 1}/${MAX_RETRY} - browser: ${browser[0]} ${browser[1]}`);

    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`   Versi WA protokol: ${version.join('.')} ${isLatest ? '(terbaru)' : '(bukan terbaru, tetap dipakai)'}`);

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        browser,
        connectTimeoutMs: 60_000,
        keepAliveIntervalMs: 25_000,
        retryRequestDelayMs: 3_000,
        generateHighQualityLinkPreview: false,
    });

    sock.ev.on('creds.update', saveCreds);
    let sudahKirim = false;

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('\n================================================');
            console.log('  SCAN QR di atas dengan WhatsApp di HP Anda');
            console.log('  WA → titik 3 → Perangkat Tertaut → Scan QR');
            console.log('================================================\n');
        }

        if (connection === 'open' && !sudahKirim) {
            sudahKirim = true;
            const nomorPengirim = sock.user?.id?.split(':')[0]?.split('@')[0] || '(tidak diketahui)';
            const namaPengirim  = sock.user?.name || sock.user?.verifiedName || '';
            console.log('\n================================================');
            console.log(`  📱 Terkirim dari nomor: ${nomorPengirim} ${namaPengirim ? '('+namaPengirim+')' : ''}`);
            console.log('================================================');
            console.log('\n✅ Terhubung! Mulai kirim pesan...\n');
            console.log(`📄 Laporan detail per pesan: ${FILE_LAPORAN}\n`);
            await delay(3);

            let ok = 0, err = 0;
            for (let i = 0; i < batch.length; i++) {
                const { jid, pesan, raw, nama } = batch[i];
                const waktu = new Date().toISOString();
                try {
                    if (adaGambar) {
                        const img = fs.readFileSync(path.resolve(FILE_GAMBAR));
                        await sock.sendMessage(jid, { image: img, caption: pesan, mimetype: 'image/png' });
                    } else {
                        await sock.sendMessage(jid, { text: pesan });
                    }
                    terkirim.add(raw); simpanLog(terkirim); ok++;
                    tulisLaporan({ waktu, nomor: raw, nama, status: 'terkirim', keterangan: '' });
                    console.log(`  ✅ [${i+1}/${batch.length}] ${raw} ${nama ? '- '+nama : ''}`);
                } catch(e) {
                    err++;
                    tulisLaporan({ waktu, nomor: raw, nama, status: 'gagal', keterangan: e.message });
                    console.log(`  ❌ [${i+1}/${batch.length}] ${raw} ${nama ? '- '+nama : ''} — ${e.message}`);
                }
                if (i < batch.length - 1) {
                    const j = JEDA_MIN + Math.floor(Math.random()*(JEDA_MAX-JEDA_MIN));
                    console.log(`     ⏳ Jeda ${j} detik...`);
                    await delay(j);
                }
            }
            console.log('\n================================================');
            console.log(`  SELESAI: ✅ ${ok} berhasil | ❌ ${err} gagal`);
            console.log(`  📄 Detail lengkap ada di: ${FILE_LAPORAN}`);
            if (sisa.length > batch.length)
                console.log(`  📅 Sisa ${sisa.length-batch.length} leads → jalankan lagi besok`);
            console.log('================================================\n');
            try { await sock.logout(); } catch(_) {}
            process.exit(0);
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode : 500;

            if (statusCode === DisconnectReason.loggedOut) {
                console.log('\n🔒 Logged out. Hapus folder auth_salut lalu coba lagi.');
                process.exit(1);
            }

            if (statusCode === 405) {
                console.log(`\n⚠️  Error 405 — mencoba browser fingerprint berbeda...`);
                try { sock.end(); } catch(_) {}
                await delay(3);
                jalankan(retryKe + 1);
            } else if (!sudahKirim) {
                console.log(`   Koneksi terputus (kode: ${statusCode}) — coba ulang...`);
                try { sock.end(); } catch(_) {}
                await delay(5);
                jalankan(retryKe + 1);
            }
        }
    });
}

// Hapus auth lama jika diminta
if (process.argv.includes('--reset')) {
    if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true });
        console.log('🗑️ Auth lama dihapus. Memulai fresh...\n');
    }
}

jalankan(0).catch(e => {
    console.error('\n❌ Error fatal:', e.message); process.exit(1);
});
