import type { ScriptHint } from '@core/types'

/**
 * Metadata satu font untuk Font Builder.
 * `files` adalah nama berkas yang akan ditulis ke OEBPS/fonts/ di dalam EPUB.
 * `source` mencatat asal open-source (lisensi) sesuai brief — pengambilan biner
 * font dilakukan EPUB Engine (Fase 3), modul ini hanya mendefinisikan katalog.
 */
export interface FontAsset {
  id: string
  /** Nama family untuk @font-face & font-family. */
  family: string
  /** Berkas per style; path relatif di dalam EPUB (OEBPS/fonts/...). */
  files: { style: 'normal' | 'italic'; weight: 400 | 700; file: string }[]
  format: 'truetype' | 'opentype'
  scripts: ScriptHint[]
  /** true: boleh di-embed ke EPUB (lisensi open-source). */
  embeddable: boolean
  /**
   * URL CDN untuk font yang TIDAK dibundel lokal (mis. CJK yang besar). Bila
   * biner lokal tak ada & opsi remote diizinkan, provideFonts mengunduhnya di
   * sini lalu men-subset (hasil embed tetap kecil). Harus ber-CORS.
   */
  remoteUrl?: string
  source: { license: string; url: string }
}

const OFL = 'SIL Open Font License 1.1'

/**
 * Katalog font open-source (brief: KFGQPC, Amiri, Scheherazade untuk Arab;
 * Literata/Noto untuk Latin & aksara lain). Bookerly TIDAK di-embed (proprietary
 * Amazon) — hanya dipakai sebagai simulasi di Live Simulator (Fase 5).
 */
export const FONT_REGISTRY: FontAsset[] = [
  // Font utama Arab/Qur'an: LPMQ Isep Misbah — standar mushaf resmi Kemenag RI.
  // Dibundel di public/fonts/; urutan pertama = font utama (primaryFont).
  {
    id: 'lpmq-isep-misbah',
    family: 'LPMQ Isep Misbah',
    files: [{ style: 'normal', weight: 400, file: 'LPMQ-IsepMisbah.ttf' }],
    format: 'truetype',
    scripts: ['arabic'],
    embeddable: true,
    source: { license: 'Kemenag RI (LPMQ) — gratis untuk mushaf', url: 'https://lajnah.kemenag.go.id/' },
  },
  {
    id: 'kfgqpc-uthmanic-hafs',
    family: 'KFGQPC Uthmanic Hafs',
    files: [{ style: 'normal', weight: 400, file: 'UthmanicHafs.otf' }],
    format: 'opentype',
    scripts: ['arabic'],
    embeddable: true,
    source: { license: 'KFGQPC Free License', url: 'https://fonts.qurancomplex.gov.sa/' },
  },
  {
    id: 'amiri-quran',
    family: 'Amiri Quran',
    files: [{ style: 'normal', weight: 400, file: 'AmiriQuran-Regular.ttf' }],
    format: 'truetype',
    scripts: ['arabic'],
    embeddable: true,
    source: { license: OFL, url: 'https://github.com/aliftype/amiri' },
  },
  {
    id: 'scheherazade-new',
    family: 'Scheherazade New',
    files: [{ style: 'normal', weight: 400, file: 'ScheherazadeNew-Regular.ttf' }],
    format: 'truetype',
    scripts: ['arabic'],
    embeddable: true,
    source: { license: OFL, url: 'https://software.sil.org/scheherazade/' },
  },
  {
    id: 'literata',
    family: 'Literata',
    files: [
      { style: 'normal', weight: 400, file: 'Literata-Regular.ttf' },
      { style: 'normal', weight: 700, file: 'Literata-Bold.ttf' },
    ],
    format: 'truetype',
    scripts: ['latin', 'cyrillic'],
    embeddable: true,
    source: { license: OFL, url: 'https://github.com/googlefonts/literata' },
  },
  {
    id: 'noto-sans-javanese',
    family: 'Noto Sans Javanese',
    files: [{ style: 'normal', weight: 400, file: 'NotoSansJavanese-Regular.ttf' }],
    format: 'truetype',
    scripts: ['javanese'],
    embeddable: true,
    source: { license: OFL, url: 'https://github.com/notofonts/javanese' },
  },
  {
    id: 'noto-sans-sundanese',
    family: 'Noto Sans Sundanese',
    files: [{ style: 'normal', weight: 400, file: 'NotoSansSundanese-Regular.ttf' }],
    format: 'truetype',
    scripts: ['sundanese'],
    embeddable: true,
    source: { license: OFL, url: 'https://github.com/notofonts/sundanese' },
  },
  // Font CJK TIDAK dibundel (9–18 MB — bertentangan dengan build ringan), tapi
  // bisa di-embed ON-DEMAND: diunduh dari CDN (remoteUrl) saat build lalu
  // di-subset sehingga hasil embed kecil. Dipilih pengguna per-region karena
  // deteksi otomatis melebur Mandarin/Jepang/Korea menjadi satu skrip 'cjk'.
  {
    id: 'noto-sans-sc',
    family: 'Noto Sans SC',
    files: [{ style: 'normal', weight: 400, file: 'NotoSansSC-Regular.ttf' }],
    format: 'truetype',
    scripts: ['cjk'],
    embeddable: true,
    remoteUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf',
    source: { license: OFL, url: 'https://fonts.google.com/noto/specimen/Noto+Sans+SC' },
  },
  {
    id: 'noto-sans-jp',
    family: 'Noto Sans JP',
    files: [{ style: 'normal', weight: 400, file: 'NotoSansJP-Regular.ttf' }],
    format: 'truetype',
    scripts: ['cjk'],
    embeddable: true,
    remoteUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosansjp/NotoSansJP%5Bwght%5D.ttf',
    source: { license: OFL, url: 'https://fonts.google.com/noto/specimen/Noto+Sans+JP' },
  },
  {
    id: 'noto-sans-kr',
    family: 'Noto Sans KR',
    files: [{ style: 'normal', weight: 400, file: 'NotoSansKR-Regular.ttf' }],
    format: 'truetype',
    scripts: ['cjk'],
    embeddable: true,
    remoteUrl: 'https://raw.githubusercontent.com/google/fonts/main/ofl/notosanskr/NotoSansKR%5Bwght%5D.ttf',
    source: { license: OFL, url: 'https://fonts.google.com/noto/specimen/Noto+Sans+KR' },
  },
]

/** Pilihan font CJK on-demand untuk UI (id + label region). */
export const CJK_FONT_CHOICES: { id: string; label: string; approxMb: number }[] = [
  { id: 'noto-sans-sc', label: 'Mandarin (SC)', approxMb: 18 },
  { id: 'noto-sans-jp', label: 'Jepang (JP)', approxMb: 10 },
  { id: 'noto-sans-kr', label: 'Korea (KR)', approxMb: 10 },
]

/** Font konten utama (untuk di-embed) yang cocok untuk sebuah skrip. */
export function fontsForScript(script: ScriptHint): FontAsset[] {
  const matches = FONT_REGISTRY.filter((f) => f.embeddable && f.scripts.includes(script))
  // Latin punya cadangan bawaan eReader; skrip khusus wajib ada font embed.
  return matches
}

/** Font utama tunggal yang direkomendasikan untuk skrip (yang pertama di katalog). */
export function primaryFont(script: ScriptHint): FontAsset | undefined {
  return fontsForScript(script)[0]
}
