/**
 * Logika layout cover MURNI (tanpa Canvas) agar dapat diuji di Node.
 * Pengukuran lebar teks disuntikkan lewat `MeasureFn` — di browser memakai
 * ctx.measureText, di test memakai aproksimasi. Ini mewujudkan "Smart Title
 * Formatting": font sizing & line wrap adaptif terhadap panjang judul.
 */
export type MeasureFn = (text: string, fontSize: number) => number

/** Bungkus teks menjadi beberapa baris agar tiap baris <= maxWidth (greedy). */
export function wrapText(text: string, maxWidth: number, fontSize: number, measure: MeasureFn): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return ['']
  const lines: string[] = []
  let line = words[0]

  for (let i = 1; i < words.length; i++) {
    const candidate = `${line} ${words[i]}`
    if (measure(candidate, fontSize) <= maxWidth) {
      line = candidate
    } else {
      lines.push(line)
      line = words[i]
    }
  }
  lines.push(line)
  return lines
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
  // Fallback ukuran minimum (biar tetap menghasilkan sesuatu).
  const lines = wrapText(title, maxWidth, minFont, measure)
  const lineHeight = minFont * lineHeightRatio
  return { fontSize: minFont, lines, lineHeight, blockHeight: lines.length * lineHeight }
}

export interface CoverDimensions {
  width: number
  height: number
  margin: number
}

/** Dimensi cover default rasio ~3:5 (umum untuk home-screen eReader). */
export const DEFAULT_COVER: CoverDimensions = { width: 1600, height: 2560, margin: 160 }
