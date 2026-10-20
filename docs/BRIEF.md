# Product Brief — Generator EPUB & Data-to-eReader App (Non-AI / Free)

> Dokumen acuan produk. Disalin & disimpan di repo sebagai sumber kebenaran fitur.
> Status implementasi terkini: lihat [CHANGELOG.md](CHANGELOG.md). Catatan/kondisi
> yang memengaruhi hasil & pratinjau: lihat [CATATAN-KONVERSI.md](CATATAN-KONVERSI.md).

## Tren & Konteks Pasar Indonesia
- Kebutuhan **Data-to-eReader** untuk membaca dokumen/laporan di E-Ink tanpa lelah mata.
- Konversi dokumen menjadi **EPUB flowable** tanpa perlu zoom-in/zoom-out.
- Integrasi transfer cepat via **QR Code & Direct Download**.

## Fitur Utama & Skenario Penggunaan
- **Skenario A** (`.docx/.md/.txt`): Heading 1 = Judul, Heading 2 memicu **Chapter Split** otomatis & **Daftar Isi (TOC)**. Format cleaner menghapus style font keras Word.
- **Skenario B** (`.csv/.xlsx`): tabel/sheet → bab & layout CSS responsif ramah E-Ink.
- **Skenario C** (URL artikel): **Reader Mode Parser** mengambil teks/gambar utama, membuang iklan/menu.

### Sistem Pembantu Otomatis (Non-AI)
- Optimasi gambar ke **Grayscale High-Contrast**.
- **Auto-generate Cover** minimalis berbasis tipografi.
- **Pre-flight Check** (validasi struktur sebelum konversi).
- Transfer instan via **QR Code** di eReader Android.

### Keunggulan Teknis
100% gratis, tanpa biaya token AI, hasil konversi instan (< 2 detik), privasi data terjaga.

## Font Builder & Special Character (Arab/Qur'an & Complex Scripts)
- **Embedded Font Library**: KFGQPC Uthman Taha Naskh, Amiri, Scheherazade New → otomatis ke `OEBPS/fonts/` agar terbaca di Kindle Gen 10 & eReader tanpa font bawaan.
- **Auto-RTL & CSS**: `dir="rtl"` + `line-height` 1.8–2.0 agar harakat/tajwid tak bertumpuk.
- **Custom Font Upload** (`.ttf/.otf`).
- **Kompatibilitas Lintas Perangkat**: EPUB 3.0 ramah Send-to-Kindle (KFX) & eReader Android/Kobo.
- **Inline SVG Fallback**: simbol/kaligrafi rumit → vektor SVG inline agar reflowable & tak pecah.

### Auto-Language Detection & Font Open Source
- **Unicode Range / Statistical**: deteksi skrip/bahasa tanpa AI (blok Unicode mis. U+0600–U+06FF Arab, atau `franc`) untuk `<dc:language>` & arah baca.
- Sumber font: Arab/Qur'an (KFGQPC, Amiri, Scheherazade); Aksara Nusantara & Internasional (Noto Sans: Jawa, Sunda, CJK, Cyrillic).

## Platform & Image Conversion (OCR & Image-Book)
- **Web App / PWA** ringan, tanpa instalasi, cocok dibuka via browser eReader Android (Onyx/Meebook) atau PC (+ QR transfer).
- **Client-Side & High Speed**: instan (< 2 dtk), tanpa backend.
- **Image-to-EPUB Dual Mode**:
  - **OCR Mode** (Tesseract.js): foto/scan → teks reflowable, lokal/gratis.
  - **Image-Book Mode**: gambar/infografis/komik → EPUB berbasis halaman gambar, kompresi + Grayscale High-Contrast.

## Multi-eReader Delivery & Send-to-Kindle
- **Send-to-Kindle** (email `@kindle.com` / web) agar lolos konversi otomatis Amazon (EPUB3 → KFX/AZW3 tanpa error font/RTL).
- Kompatibel **Calibre, Kobo Web Drop, Readwise, Google Drive/Dropbox**.
- EPUB 3.0 valid (**lolos epubcheck**) → tak corrupt di konverter/pembaca pihak ketiga (KOReader, Moon+ Reader, NeoReader).

## Lightweight Layout & Streamlined TOC
- **Flat TOC** (`toc.ncx` + `nav.xhtml`), maksimal 2 level (Bab & Sub-bab).
- **Zero-Bloat CSS**: hapus inline styling, warna latar berlebih, box-shadow, animasi.
- **File Splitting Pintar**: pecah per bab agar RAM eReader tak penuh.
- **Resource Lean**: batasi ukuran gambar & subset font hanya karakter terpakai; EPUB < 2 MB.

## Public Domain & Preset Library (Juz Amma / Classics)
- Murni converter file (bukan AI/database): materi seperti Juz Amma tetap diproses dari file sumber dengan Embedded Font Arab, Auto-RTL, Lightweight TOC.
- **Built-in Starter Library**: tombol unduh instan materi populer/public-domain (Juz Amma Standar Madinah, UUD 1945, Buku Klasik).

## Menu Rekomendasi & Public Repo Integration
- Katalog/menu rekomendasi bacaan siap generate.
- **Automasi Fetch**: Al-Qur'an via **quran.com API** / GitHub repo; Buku klasik via **Project Gutenberg & Wikisource**.
- **Auto-Compile Engine**: pilih rekomendasi → tarik data repo publik → terapkan Font Builder + RTL → susun EPUB instan.

## Universal Cover Generator (Adaptive to Title & Metadata)
- Tiga jalur: **Custom Upload**, **Auto-Extract** (gambar pertama dokumen/web), **HTML5 Canvas** dinamis.
- Canvas: Smart Title Formatting (font sizing, line wrap), **Topic/Category Preset** (Keagamaan/Arab → ornamen islami; Laporan/Data → Technical Clean; Novel → Classic Serif), Standard Metadata Injection (`<meta name="cover">` + `properties="cover-image"`).

## Dual-Mode Architecture (Online & Offline PWA)
- **Online**: fetch repo publik (quran.com, Gutenberg, Wikisource), konversi URL, Send-to-Kindle.
- **Offline (Standalone PWA)**: konversi dokumen lokal, OCR, cover canvas, embed font 100% tanpa server.

## eReader Aesthetic UI, Grayscale Tone, & Onboarding
- Tampilan minimalis ala eReader (Onyx/Kindle). Mode warna: **Warm Paper #F8F6F0** & **Pure Grayscale High-Contrast**.
- Tipografi UI: Bookerly/Literata/Inter. Onboarding tooltip (deteksi localStorage). Tombol besar ramah sentuh e-ink.

### Button & Typography Guidelines (E-Ink)
- Border tegas 2px `#000`, fill `#FFF`/`#000` inverted; tanpa gradient/shadow/animasi.
- Tap target 48–56px. Feedback via border putus-putus / inverted.
- Primary UI Font: Inter/Roboto/Noto Sans. Konten: Bookerly/Literata/Charis SIL (Latin), KFGQPC/Amiri (Arab), Noto (Jawa/Sunda/CJK).
- Hierarki: Title 24px Bold, Subtitle 18px Medium, Body 14–16px, Button 16px.

## Multi-eReader Interactive Live Simulator
- Frame perangkat native (In-App EPUB Reader Preview) sebelum unduh/kirim.
- Tab: **Kindle** (Bookerly, KFX), **Kobo** (Caecilia/Georgia), **Onyx Boox/Meebook** (NeoReader, Noto/Bookerly).
- Interactive settings: ubah font size, mode RTL, pemecahan bab/TOC, layout tabel/gambar real-time.

## Responsive UI & Performance (E-Ink)
- Mobile-First & Adaptive: **Single Column** (eReader/HP) & **Dual-Pane** (Tablet/PC).
- Client-side, < 2 dtk, Zero-Bloat CSS, **Smart Lazy Loading** (Tesseract OCR), Chapter-Based Splitting.

## eReader Immersion Mode (Browser)
- Toggle [📱 Mode Web] ↔ [📖 Mode eReader]: Warm Paper/Grayscale, font ala eReader, navigasi page-flip ketuk tanpa scroll.

## Technology Stack (100% Client-Side & Open-Source)
- **Core**: Vite + React (TypeScript) + `vite-plugin-pwa`.
- **Parsing/EPUB**: JSZip, Mammoth.js (.docx), SheetJS (.xlsx) & Marked.js (.md), Readability.js (URL).
- **Deteksi/OCR/Format**: Unicode Range / `franc-min`, Tesseract.js (lazy), HTML5 Canvas, Driver.js (onboarding).
- **UI/Deploy**: Tailwind CSS (Zero-Bloat), hosting gratis Vercel/GitHub Pages/Cloudflare Pages.

## Compiler & Conversion Engine
- Event-driven & stream parsing, zero heavy runtime overhead; penyusunan ZIP/OPF/CSS paralel di RAM browser.
- Waktu kompilasi < 1–2 dtk; RAM < 50 MB; tanpa freeze bahkan di eReader spec rendah.
