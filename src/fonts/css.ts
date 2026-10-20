import type { ScriptHint, TextDirection } from '@core/types'
import type { FontAsset } from './fonts'

/** Bangun aturan @font-face untuk font yang akan di-embed ke OEBPS/fonts/. */
export function buildFontFaceCss(fonts: FontAsset[], fontDir = 'fonts/'): string {
  const rules: string[] = []
  for (const font of fonts) {
    for (const f of font.files) {
      rules.push(
        [
          '@font-face {',
          `  font-family: "${font.family}";`,
          `  font-style: ${f.style};`,
          `  font-weight: ${f.weight};`,
          `  src: url("${fontDir}${f.file}") format("${font.format}");`,
          `  font-display: swap;`,
          '}',
        ].join('\n'),
      )
    }
  }
  return rules.join('\n\n')
}

/** Stack font-family konten per skrip, diakhiri cadangan bawaan eReader. */
export function readingFontStack(script: ScriptHint, primaryFamily?: string): string {
  const quote = (s: string) => (s.includes(' ') ? `"${s}"` : s)
  const stacks: Record<ScriptHint, string[]> = {
    arabic: ['LPMQ Isep Misbah', 'KFGQPC Uthmanic Hafs', 'Amiri Quran', 'Scheherazade New', 'serif'],
    latin: ['Literata', 'Bookerly', 'Charis SIL', 'Georgia', 'serif'],
    cyrillic: ['Literata', 'Georgia', 'serif'],
    cjk: ['Noto Sans CJK', 'sans-serif'],
    javanese: ['Noto Sans Javanese', 'sans-serif'],
    sundanese: ['Noto Sans Sundanese', 'sans-serif'],
    unknown: ['Literata', 'Georgia', 'serif'],
  }
  const list = primaryFamily ? [primaryFamily, ...stacks[script]] : stacks[script]
  return list.map(quote).join(', ')
}

export interface ReadingCssOptions {
  script: ScriptHint
  direction: TextDirection
  /** Family font kustom yang diunggah pengguna (ditaruh paling depan). */
  customFamily?: string
}

/**
 * CSS konten EPUB ramah E-Ink:
 *  - Auto-RTL: dir rtl + text-align right untuk Arab.
 *  - line-height longgar (2.0 Arab) agar harakat/tajwid tidak bertumpuk.
 *  - Zero-Bloat: tanpa warna latar, shadow, atau animasi.
 */
export function buildReadingCss(opts: ReadingCssOptions): string {
  const { script, direction } = opts
  const isArabic = script === 'arabic'
  const lineHeight = isArabic ? '2.0' : '1.6'
  const family = readingFontStack(script, opts.customFamily)

  return [
    'html, body {',
    '  margin: 0;',
    '  padding: 0;',
    '  color: #000000;',
    '  background: #ffffff;',
    '}',
    // Catatan: properti CSS `direction` DILARANG di stylesheet EPUB (epubcheck
    // CSS-001). Arah baca ditetapkan via atribut dir="rtl" pada <html>/<body>
    // (lihat render.ts). text-align tetap boleh untuk perataan teks.
    'body {',
    `  font-family: ${family};`,
    `  line-height: ${lineHeight};`,
    `  text-align: ${direction === 'rtl' ? 'right' : 'left'};`,
    '  font-size: 1em;',
    '  margin: 1em 1.2em;',
    '}',
    isArabic ? 'p { text-align: justify; }' : 'p { text-align: inherit; }',
    'h1, h2, h3 { line-height: 1.3; font-weight: 700; }',
    'h1 { font-size: 1.6em; }',
    'h2 { font-size: 1.35em; }',
    'h3 { font-size: 1.15em; }',
    // Tabel ramah E-Ink: border tegas, tanpa warna
    'table { border-collapse: collapse; width: 100%; }',
    'th, td { border: 1px solid #000000; padding: 0.3em 0.5em; text-align: start; }',
    'img { max-width: 100%; height: auto; }',
  ].join('\n')
}

/** Stylesheet konten lengkap: @font-face + aturan baca. */
export function buildContentCss(opts: ReadingCssOptions, embedFonts: FontAsset[], fontDir = 'fonts/'): string {
  const face = buildFontFaceCss(embedFonts, fontDir)
  const reading = buildReadingCss(opts)
  return face ? `${face}\n\n${reading}\n` : `${reading}\n`
}
