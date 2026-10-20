# Changelog

Acuan produk: [BRIEF.md](BRIEF.md). Catatan yang memengaruhi hasil: [CATATAN-KONVERSI.md](CATATAN-KONVERSI.md).

## 2026-10-20 — Penuntasan fitur brief, Android, notifikasi & PDF

### Sumber masukan
- **PDF** (baru): ekstrak teks via `pdfjs-dist` (lazy chunk, tak membebani bundle awal),
  deteksi heading heuristik dari ukuran font → chapter split & TOC. PDF hasil pindai
  (tanpa teks) diarahkan ke OCR/Image-Book lewat pesan jelas + toast. `src/parsers/pdf.ts`.
- **Image-Book Mode** tersambung ke UI (tab "Gambar (Buku)", multi-gambar → grayscale →
  EPUB per-halaman). `buildEpub` kini meng-embed `ir.assets` (gambar) ke OEBPS + manifest OPF.

### Font
- **Custom Font Upload** (`.ttf/.otf`) tersambung ke UI (panel Opsi) + disematkan & di-subset.
- **Noto Nusantara** (Jawa/Sunda) dibundel. **CJK on-demand**: pilih region (SC/JP/KR) →
  unduh dari CDN saat build → subset (embed kecil) → cache SW untuk offline.

### Konten & struktur
- **Inline SVG Fallback** untuk ligatur kaligrafi (﷽ ﷺ ﷻ) + `properties="svg"` di manifest.
- **Pustaka Siap-Pakai / Public Repo**: Juz Amma (quran.com API, teks Uthmani ± terjemahan
  Kemenag), UUD 1945 (offline). `src/presets/`.

### Metadata & Sampul (lanjutan)
- **Metadata lengkap** dapat diedit & ditulis ke OPF (Dublin Core): bahasa (select),
  **arah baca** LTR/RTL (override, berlaku ke seluruh bab), penerbit (`dc:publisher`),
  deskripsi (`dc:description`), subjek/kategori (`dc:subject`).
- **Sampul** pakai tombol-kartu jelas (Buat Otomatis / Unggah Gambar / Tanpa Sampul) +
  pratinjau WYSIWYG + pemilih Gaya ber-thumbnail nyata (Otomatis/Klasik/Religius/Teknis).
- **Perbaikan overlap teks cover**: `wrapText` memecah kata panjang (hubung lalu paksa
  per-huruf), `fitFontSize` memberi elipsis bila tetap kepanjangan, ukuran font kini
  **relatif lebar cover** (pratinjau kecil = ekspor besar, WYSIWYG), blok judul diklem agar
  tak terpotong di atas. Guard regresi di smoke (105) & validate (134, +dc:publisher/description/subject).

### Perbaikan tata letak (anti-overflow) & kosmetik perangkat
- **Fix overflow** di dual-pane (kolom sempit): tombol Metadata (Bahasa/Arah baca jadi
  full-width stacked), kartu Gaya Sampul & tombol mode Simulator (`min-w-0` + susun ulang
  baris) tak lagi terpotong.
- **Live Simulator ala perangkat asli**: bezel membulat border tipis (kiri/kanan/atas) +
  "dagu" bermerek (kindle/kobo/BOOX/Bigme) + **judul buku sebagai keterangan kosmetik** di
  bawah bingkai.
- **Daftar Bab bisa diklik** → bab yang dipilih tampil di Live Simulator (bab aktif disorot).

### UI/UX
- **Dual-Pane** layar lebar (editor kiri, Live Simulator sticky kanan); satu kolom di HP.
- **Live Simulator**: mode **Gulir** & **Halaman** (page-flip ketuk) + device **Bigme**
  (Android E-Ink) di samping Kindle/Kobo/Onyx.
- **Kirim ke Kindle** (uploader Amazon + mailto `@kindle.com`).
- **Notifikasi**: toast in-app (info/success/warning/error) + **notifikasi sistem** saat
  EPUB selesai (muncul walau tab di-background); build asinkron non-blocking.
- **Info online per-aksi**: banner offline, peringatan di picker CJK / tab URL / OCR,
  toast saat preset online dipilih atau font CJK gagal diunduh.

### Kualitas
- `scripts/fixtures.ts` + fixture Image-Book+SVG; `scripts/validate.ts` +asersi aset/SVG.
- **epubcheck 5.1.0**: Latin, Arab, Image-Book+SVG, CJK (JP) — semua **0 error**.
- Verifikasi: typecheck bersih · smoke 102/102 · validate 131/131 (0 orphan/warning) · build OK.
- Bundle utama ~511 KB; `xlsx`, `mammoth`, `pdfjs`, `hb-subset.wasm`, font CJK = lazy/remote.

### Deviasi dari brief (disengaja)
- Font **UI** memakai **Literata serif** (permintaan pengguna), bukan Inter/Roboto sans.
- Onboarding **custom** (bukan Driver.js) agar konsisten Zero-Bloat (tanpa animasi).
- **CJK** tidak dibundel (ukuran) — disediakan on-demand; **Gutenberg/Wikisource** belum
  diintegrasikan (quran.com sudah; sisanya bisa menyusul).
