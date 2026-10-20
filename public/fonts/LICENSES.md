# Lisensi Font yang Dibundel

Font berikut dibundel di `public/fonts/` dan disematkan (embed) ke dalam EPUB yang
dihasilkan. Semua berlisensi bebas untuk disematkan. Teks lisensi lengkap tersedia
pada tautan masing-masing.

| Berkas | Family | Skrip | Lisensi | Sumber |
|---|---|---|---|---|
| `LPMQ-IsepMisbah.ttf` | LPMQ Isep Misbah | Arab/Qur'an | Kemenag RI (LPMQ) — gratis untuk mushaf | https://lajnah.kemenag.go.id/ |
| `UthmanicHafs.otf` | KFGQPC Uthmanic Hafs | Arab/Qur'an | KFGQPC Free License | https://fonts.qurancomplex.gov.sa/ |
| `AmiriQuran-Regular.ttf` | Amiri Quran | Arab | SIL Open Font License 1.1 | https://github.com/aliftype/amiri |
| `ScheherazadeNew-Regular.ttf` | Scheherazade New | Arab | SIL Open Font License 1.1 | https://software.sil.org/scheherazade/ |
| `Literata-Regular.ttf` | Literata | Latin/Kiril | SIL Open Font License 1.1 | https://github.com/googlefonts/literata |
| `Literata-Bold.ttf` | Literata | Latin/Kiril | SIL Open Font License 1.1 | https://github.com/googlefonts/literata |
| `literata-latin-400.woff2` | Literata | Latin (UI) | SIL Open Font License 1.1 | https://github.com/googlefonts/literata |
| `literata-latin-700.woff2` | Literata | Latin (UI) | SIL Open Font License 1.1 | https://github.com/googlefonts/literata |
| `NotoSansJavanese-Regular.ttf` | Noto Sans Javanese | Aksara Jawa | SIL Open Font License 1.1 | https://fonts.google.com/noto/specimen/Noto+Sans+Javanese |
| `NotoSansSundanese-Regular.ttf` | Noto Sans Sundanese | Aksara Sunda | SIL Open Font License 1.1 | https://fonts.google.com/noto/specimen/Noto+Sans+Sundanese |

`.ttf` dipakai untuk disematkan ke EPUB (bisa di-subset); `.woff2` ringan dipakai
sebagai font antarmuka aplikasi (UI).

## Font CJK (on-demand, tidak dibundel)

Font CJK berukuran besar (9–18 MB) **tidak** dibundel demi menjaga build ringan,
tetapi dapat disematkan secara **on-demand**: saat pengguna memilih region, biner
diunduh dari CDN `raw.githubusercontent.com/google/fonts` lalu di-subset (hasil
embed kecil) dan di-cache Service Worker untuk offline. Semua berlisensi SIL OFL 1.1.

| Family | Region | Sumber |
|---|---|---|
| Noto Sans SC | Mandarin (Simplified) | https://fonts.google.com/noto/specimen/Noto+Sans+SC |
| Noto Sans JP | Jepang | https://fonts.google.com/noto/specimen/Noto+Sans+JP |
| Noto Sans KR | Korea | https://fonts.google.com/noto/specimen/Noto+Sans+KR |

Font di bawah SIL OFL 1.1 boleh digunakan, dimodifikasi (termasuk subsetting),
dan disematkan ke dokumen secara bebas. Lihat https://openfontlicense.org/.
