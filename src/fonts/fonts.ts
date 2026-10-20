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
  {
    id: 'noto-sans-cjk',
    family: 'Noto Sans CJK',
    files: [{ style: 'normal', weight: 400, file: 'NotoSansCJKsc-Regular.otf' }],
    format: 'opentype',
    scripts: ['cjk'],
    embeddable: true,
    source: { license: OFL, url: 'https://github.com/notofonts/noto-cjk' },
  },
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
