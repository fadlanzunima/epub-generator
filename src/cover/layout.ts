/**
 * Logika layout cover MURNI (tanpa Canvas) agar dapat diuji di Node.
 * Pengukuran lebar teks disuntikkan lewat `MeasureFn` — di browser memakai
 * ctx.measureText, di test memakai aproksimasi. Ini mewujudkan "Smart Title
 * Formatting": font sizing & line wrap adaptif terhadap panjang judul.
 */
export type MeasureFn = (text: string, fontSize: number) => number

/** Pecah string per-karakter menjadi potongan yang masing-masing <= maxWidth. */
function hardBreak(s: string, maxWidth: number, fontSize: number, measure: MeasureFn): string[] {
  if (measure(s, fontSize) <= maxWidth) return [s]
  const out: string[] = []
  let buf = ''
  for (const ch of s) {
    if (buf && measure(buf + ch, fontSize) > maxWidth) {
      out.push(buf)
      buf = ch
    } else {
      buf += ch
    }
  }
  if (buf) out.push(buf)
  return out
}

/**
 * Pecah satu kata yang lebih lebar dari maxWidth menjadi beberapa potongan yang
 * muat: utamakan pada tanda hubung (mis. "Undang-Undang"), lalu paksa per-huruf.
 * Mencegah kata panjang meluber keluar kanvas (overlap).
 */
function splitLongWord(word: string, maxWidth: number, fontSize: number, measure: MeasureFn): string[] {
  if (measure(word, fontSize) <= maxWidth) return [word]
  const out: string[] = []
  let buf = ''
  // Pertahankan tanda hubung di akhir segmen (lookbehind).
  for (const seg of word.split(/(?<=-)/)) {
    for (const piece of hardBreak(seg, maxWidth, fontSize, measure)) {
      if (buf && measure(buf + piece, fontSize) <= maxWidth) {
        buf += piece
      } else {
        if (buf) out.push(buf)
        buf = piece
      }
    }
  }
  if (buf) out.push(buf)
  return out
}

/**
 * Bungkus teks menjadi beberapa baris agar tiap baris <= maxWidth (greedy).
 * Kata yang lebih lebar dari maxWidth dipecah (hubung/paksa) sehingga TIDAK ada
 * baris yang meluber — kunci agar judul panjang tak overlap di cover.
 */
export function wrapText(text: string, maxWidth: number, fontSize: number, measure: MeasureFn): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let line = ''

  const place = (piece: string, spaceBefore: boolean) => {
    const candidate = line ? (spaceBefore ? `${line} ${piece}` : line + piece) : piece
    if (!line || measure(candidate, fontSize) <= maxWidth) {
      line = candidate
    } else {
      lines.push(line)
      line = piece
    }
  }

  for (const word of words) {
    const pieces = splitLongWord(word, maxWidth, fontSize, measure)
    // Potongan pertama kata diberi spasi; sambungan kata-panjang menempel.
    pieces.forEach((p, i) => place(p, i === 0))
  }
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

export interface FitOptions {
  maxWidth: number
  maxHeight: number
  maxFont: number
  minFont: number
  lineHeightRatio: number
  /** Batas jumlah baris; jika terlampaui, perkecil font lagi. */
  maxLines: number
}

export interface FitResult {
  fontSize: number
  lines: string[]
  lineHeight: number
  /** Total tinggi blok judul. */
  blockHeight: number
}

/**
 * Cari ukuran font terbesar sehingga judul (setelah wrap) muat dalam
 * maxWidth x maxHeight dan <= maxLines. Judul pendek -> font besar,
 * judul panjang -> font mengecil & lebih banyak baris (proporsional).
 */
export function fitFontSize(title: string, opts: FitOptions, measure: MeasureFn): FitResult {
  const { maxWidth, maxHeight, maxFont, minFont, lineHeightRatio, maxLines } = opts
  for (let fontSize = maxFont; fontSize >= minFont; fontSize -= 2) {
    const lines = wrapText(title, maxWidth, fontSize, measure)
    const lineHeight = fontSize * lineHeightRatio
    const blockHeight = lines.length * lineHeight
    const widest = Math.max(...lines.map((l) => measure(l, fontSize)))
    if (lines.length <= maxLines && blockHeight <= maxHeight && widest <= maxWidth) {
      return { fontSize, lines, lineHeight, blockHeight }
    }
  }
  // Fallback: judul tetap kepanjangan di ukuran minimum -> batasi ke maxLines
  // dan beri elipsis pada baris terakhir agar tak meluber (vertikal) / overlap.
  const lineHeight = minFont * lineHeightRatio
  const all = wrapText(title, maxWidth, minFont, measure)
  let lines = all
  if (all.length > maxLines) {
    lines = all.slice(0, maxLines)
    let last = lines[maxLines - 1]
    while (last.length > 1 && measure(`${last}…`, minFont) > maxWidth) {
      last = last.slice(0, -1)
    }
    lines[maxLines - 1] = `${last.trimEnd()}…`
  }
  return { fontSize: minFont, lines, lineHeight, blockHeight: lines.length * lineHeight }
}

export interface CoverDimensions {
  width: number
  height: number
  margin: number
}

/** Dimensi cover default rasio ~3:5 (umum untuk home-screen eReader). */
export const DEFAULT_COVER: CoverDimensions = { width: 1600, height: 2560, margin: 160 }
