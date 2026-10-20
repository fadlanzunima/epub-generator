# Catatan Konversi — Kondisi yang Memengaruhi Hasil & Pratinjau

Daftar faktor yang memengaruhi **hasil EPUB** dan **pratinjau Live Simulator**, beserta
rekomendasi per-sumber. Tanda: 🔔 = sudah diberitahu di app (toast/banner), 🔇 = senyap.

## A. Pratinjau ≠ hasil akhir (wajar — ini simulasi)
- **Font Latin**: Simulator pakai font *simulasi perangkat* (Georgia/Palatino/Literata/Noto);
  EPUB meng-embed **Literata**. Hasil di device tergantung reader pakai font embed atau sendiri.
- **Font Arab**: pratinjau muat font asli dari `/fonts/` (cocok dgn embed); di device, bila
  "publisher font" dimatikan, Arab jatuh ke font device (harakat bisa berantakan).
- **Mode Halaman (page-flip)**: aproksimasi kolom CSS; paginasi nyata device berbeda; RTL bisa kurang presisi.
- **Gambar Image-Book**: tidak tampil di pratinjau (path `../images/` tak ter-resolve) — Simulator disembunyikan untuk mode Buku.
- **Sampul**: tidak tampil di Simulator (hanya isi bab).

## B. Per-sumber masukan

### PDF 🔔
- **Didukung: PDF berteks** — teks diekstrak langsung (pdf.js), heading dideteksi **heuristik
  dari ukuran font** → chapter split & TOC.
- **PDF hasil PINDAI / gambar** (tanpa lapisan teks) → **tak ada teks** untuk diekstrak. App
  memberi tahu & menolak dengan saran: pakai tab **Gambar (OCR)** (teks bisa dicari) atau
  **Gambar (Buku)** (buku berbasis gambar).
- **Keterbatasan**: struktur PDF tak semantik → deteksi bab bergantung ukuran font; PDF
  berkolom/berlapis, header/footer berulang, atau tabel kompleks bisa tercampur/kurang rapi.
  Sub-bab (level 3) tidak dideteksi dari PDF. Rekomendasi: untuk hasil terbaik gunakan
  `.docx/.md` bila tersedia; PDF cocok untuk teks mengalir (laporan, artikel, buku teks).
- Font pdf.js (±1.7 MB worker+lib) **lazy** — hanya diunduh saat pertama membuka PDF.

### .docx (Mammoth) 🔇
- Format rumit (tabel bersarang, text box, footnote, rumus, kolom) bisa disederhanakan/hilang.
  Style keras Word dibersihkan (disengaja). H1=judul, H2=chapter split.

### .csv / .xlsx (SheetJS) 🔇
- Hanya teks sel — rumus, merge cell, styling diabaikan. Sheet besar → tabel besar.

### URL / Artikel (Readability) 🔔(offline)
- Kualitas ekstraksi tergantung struktur halaman. **CORS** sering blokir fetch → pakai tempel HTML.
- **Gambar artikel** sering tautan **http remote** → bisa tak tampil offline & memicu catatan epubcheck. 🔇

### OCR (Tesseract) 🔔(offline)
- Akurasi tergantung kualitas gambar & bahasa; **data latih** diunduh sekali saat pertama (online).

### Image-Book 🔔
- Grayscale High-Contrast + skala maks sisi 1600px + JPEG q0.85 → warna hilang (E-Ink) & kompromi ukuran.

### Pustaka (quran.com) 🔔
- Butuh internet + API hidup; terjemahan terkunci **Kemenag (id-33)**.

### Pustaka klasik (Wikisource) 🔔
- Butuh internet; teks ditarik via **MediaWiki action API** (CORS `origin=*`) lalu dibersihkan
  Readability. Hanya judul yang **teksnya utuh di satu halaman** yang cocok (sebagian karya
  Wikisource dipecah ke sub-halaman). **Gutenberg** tidak dipakai langsung — servernya tanpa CORS.

## C. Font
- Hanya **font utama per-skrip** yang di-embed (Resource Lean); cadangan hanya di CSS stack. 🔇
- Checkbox **"Sematkan font" OFF** pada dokumen non-Latin → Arab bisa rusak di device tanpa font. 🔇
- **CJK** butuh pilih region + internet; kalau gagal/di-skip → font device. 🔔
- Font kustom saat "Sematkan font" OFF → di-embed **utuh** (besar). Variable font kadang salah berat di reader lama.

## D. Lingkungan / runtime
- Semua di **RAM browser** — dokumen sangat besar bisa lambat/kehabisan memori (target <50MB, <2 dtk).
- Build asinkron (non-blocking) + notifikasi saat selesai. Subsetting font (termasuk **CJK**
  10–18 MB) kini berjalan di **Web Worker** → UI tak freeze; fail-safe (font utuh bila gagal) +
  fallback main-thread bila Worker tak tersedia.
- Build butuh fetch `/fonts/` + `hb-subset.wasm` (lazy); offline pertama kali sebelum ter-cache → embed bisa gagal.
- **Mode Hemat Memori** 🔔 (tombol *Hemat RAM*, auto bila `deviceMemory ≤ 2GB`): menyembunyikan
  **OCR** & **embed font CJK** (fitur paling boros RAM) agar lancar di E-Ink/HP kecil. Konversi
  `.docx/.md/.txt/.csv/.xlsx/.pdf`, URL, Image-Book, & embed font Latin/Arab tetap jalan.

## E. Validitas
- Keluaran **EPUB 3.0 standar, lulus epubcheck 5.1.0** → terbaca di eReader Android (Bigme, Onyx
  Boox, Meebook, Boyue) via reader bawaan / KOReader / Moon+ Reader / ReadEra, juga Kobo & (via
  Send-to-Kindle) Kindle. Font Arab/Qur'an di-embed → tampil benar tanpa font perangkat.
- **Inline SVG** hanya untuk ligatur tertentu (﷽ ﷺ ﷻ); kaligrafi/simbol lain tak dikonversi.

## F. Kompatibilitas peramban 🔔
- Aplikasi butuh peramban **modern** (ES Modules, WebAssembly, Worker, Canvas, Blob). Peramban
  sangat lama — mis. **browser bawaan Kindle lama (Experimental Browser)** — tidak didukung:
  app mendeteksi & menampilkan **pesan panduan** (buat di HP/PC lalu kirim `.epub` via
  Send-to-Kindle), bukan layar kosong. **Berkas EPUB hasilnya tetap kompatibel** dengan Kindle lama.
- Didukung baik: Chrome/Edge/Firefox/Safari terbaru, termasuk **E-Ink Android** (Bigme/Onyx/Meebook)
  dengan WebView modern. RAM 2GB cukup untuk pemakaian normal (lihat Mode Hemat Memori di atas).

## G. Telemetri (opsional) 🔔(README)
- Bila di-deploy dengan env `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`, app mengirim **ringkasan
  event build** (attempt/success/fail) ke Telegram pemilik: judul, ukuran, sumber, skrip, jumlah
  bab, user-agent, waktu. **Isi dokumen TIDAK dikirim.** Tanpa env → endpoint `/api/report` no-op
  (tak ada data terkirim) sehingga app tetap sepenuhnya privat secara bawaan.
