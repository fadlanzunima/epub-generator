import type { Chapter, ScriptHint, TextDirection } from '@core/types'
import { renderChapterXhtml } from '@epub'
import { buildReadingCss, buildFontFaceCss, fontsForScript } from '@fonts'

/**
 * Preset perangkat E-Ink untuk Live Simulator (Fase 5).
 * `ppiWidth` = lebar piksel layar nyata (untuk rasio bezel); tampilan di-skala.
 * `deviceFont` mensimulasikan font baca bawaan perangkat (Latin saja — skrip
 * Arab/non-Latin tetap memakai stack-nya sendiri agar harakat benar).
 */
export interface Device {
  id: 'kindle' | 'kobo' | 'onyx' | 'bigme'
  name: string
  /** Rasio layar (lebar / tinggi). E-Ink umumnya ~0.75 (4:3). */
  aspect: number
  /** Ukuran font dasar (px) pada lebar tampil 280px — tipikal perangkat. */
  baseFontPx: number
  /** Simulasi font bawaan perangkat untuk teks Latin. */
  deviceFont: string
  /** Catatan kecil di bawah bingkai. */
  note: string
  /** Label merek pada "dagu" bingkai (kosmetik, meniru perangkat asli). */
  brand: string
}

export const DEVICES: Device[] = [
  {
    id: 'kindle',
    name: 'Kindle',
    aspect: 0.75,
    baseFontPx: 17,
    deviceFont: 'Georgia, "Times New Roman", serif', // simulasi Bookerly
    note: 'Amazon · simulasi Bookerly',
    brand: 'kindle',
  },
  {
    id: 'kobo',
    name: 'Kobo',
    aspect: 0.75,
    baseFontPx: 17,
    deviceFont: '"Palatino Linotype", Georgia, serif',
    note: 'Rakuten Kobo',
    brand: 'kobo',
  },
  {
    id: 'onyx',
    name: 'Onyx Boox',
    aspect: 0.75,
    baseFontPx: 16,
    deviceFont: '"Literata", Georgia, serif',
    note: 'Onyx Boox / Meebook',
    brand: 'BOOX',
  },
  {
    id: 'bigme',
    name: 'Bigme',
    aspect: 0.75,
    baseFontPx: 16,
    deviceFont: '"Noto Serif", Georgia, serif',
    note: 'Bigme · Android E-Ink (NeoReader/KOReader)',
    brand: 'Bigme',
  },
]

export interface PreviewOptions {
  device: Device
  script: ScriptHint
  direction: TextDirection
  lang: string
  /** Pengali ukuran font dari kontrol A- / A+ (0.8–1.6). */
  fontScale: number
  /**
   * Mode halaman (page-flip ala eReader): konten dibagi kolom selebar layar
   * sehingga tidak ada scroll — perpindahan halaman via ketuk/tombol. Lebar
   * layar (px) wajib diisi agar langkah kolom = lebar layar.
   */
  paged?: boolean
  displayWidth?: number
}

/** Padding horizontal (px) tiap halaman pada mode paged — lihat Simulator. */
export const PAGE_PAD_X = 20
const PAGE_PAD_Y = 16

/**
 * Bangun dokumen HTML mandiri (CSS inline) untuk `<iframe srcDoc>`:
 *  - Memakai ulang renderChapterXhtml (render bab identik dengan EPUB nyata).
 *  - Menyuntik buildReadingCss + override perangkat (ukuran & font dasar).
 * Non-Arab memakai font simulasi perangkat; Arab mempertahankan stack Naskh.
 */
export function buildPreviewDoc(chapter: Chapter, opts: PreviewOptions): string {
  const xhtml = renderChapterXhtml(chapter, { chapterId: chapter.id, lang: opts.lang, cssHref: '' })

  // Buang deklarasi XML & DOCTYPE agar iframe me-render sebagai HTML biasa.
  const bodyDoc = xhtml
    .replace(/^<\?xml[^>]*\?>\s*/, '')
    .replace(/^<!DOCTYPE[^>]*>\s*/im, '')
    .replace(/<link[^>]*\/>\s*/i, '')

  const reading = buildReadingCss({ script: opts.script, direction: opts.direction })
  const fontPx = Math.round(opts.device.baseFontPx * opts.fontScale)
  const isArabic = opts.script === 'arabic'

  // Untuk Arab, muat font embed nyata dari /fonts/ (dibundel di public/fonts/)
  // agar pratinjau menampilkan glyph & harakat sebenarnya — bukan fallback serif.
  const faceCss = isArabic ? buildFontFaceCss(fontsForScript('arabic'), '/fonts/') : ''

  // Mode halaman: bagi konten menjadi kolom selebar layar (tanpa scroll).
  // Langkah antar-halaman = lebar layar: columnWidth + columnGap = displayWidth.
  let pagedCss = ''
  if (opts.paged && opts.displayWidth) {
    const colWidth = Math.max(80, opts.displayWidth - 2 * PAGE_PAD_X)
    const colGap = 2 * PAGE_PAD_X
    pagedCss = [
      'html { height: 100%; overflow: hidden; }',
      'body {',
      '  margin: 0;',
      '  height: 100%;',
      '  box-sizing: border-box;',
      `  padding: ${PAGE_PAD_Y}px ${PAGE_PAD_X}px;`,
      `  column-width: ${colWidth}px;`,
      `  column-gap: ${colGap}px;`,
      '  column-fill: auto;',
      '  transform: translateX(0);',
      '  will-change: transform;',
      '}',
    ].join('\n')
  }

  const deviceCss = [
    faceCss,
    `html { font-size: ${fontPx}px; }`,
    // Hanya override font Latin; skrip khusus pertahankan stack-nya.
    isArabic ? '' : `body { font-family: ${opts.device.deviceFont}; }`,
    // E-Ink: latar putih murni, tanpa seleksi highlight menyilaukan.
    'body { background: #ffffff; -webkit-font-smoothing: none; }',
    pagedCss,
  ]
    .filter(Boolean)
    .join('\n')

  return bodyDoc.replace(
    /<\/head>/i,
    `<style>\n${reading}\n${deviceCss}\n</style>\n</head>`,
  )
}
