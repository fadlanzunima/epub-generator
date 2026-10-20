/**
 * Parser PDF (browser) — ekstrak teks per halaman via pdf.js (pdfjs-dist),
 * lazy-import agar TIDAK membebani bundle awal (seperti mammoth/xlsx).
 * Heading dideteksi heuristik dari ukuran font (PDF tak punya struktur semantik)
 * agar pemisahan bab & TOC tetap jalan. 100% client-side.
 *
 * Catatan: PDF hasil PINDAI (gambar tanpa lapisan teks) tidak punya teks untuk
 * diekstrak — pengguna diarahkan ke tab Gambar (OCR) / Gambar (Buku).
 */
import type { ContentBlock } from '@core/types'

interface Line {
  text: string
  size: number
  y: number
  page: number
}

/** Median dari array angka (untuk perkiraan ukuran font badan teks). */
function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const s = [...nums].sort((a, b) => a - b)
  const m = Math.floor(s.length / 2)
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2
}

/** Rakit item teks satu halaman menjadi baris (kelompok per-y berdekatan). */
function itemsToLines(
  items: { str: string; height: number; transform: number[] }[],
  page: number,
): Line[] {
  const lines: Line[] = []
  let cur: { parts: string[]; size: number; y: number; x: number } | null = null

  for (const it of items) {
    const str = it.str
    const y = it.transform[5]
    const x = it.transform[4]
    // Ukuran font = skala vertikal matriks teks (lebih andal dari it.height yang
    // sering seragam pada PDF hasil cetak browser).
    const size = Math.hypot(it.transform[2], it.transform[3]) || it.height || 10
    if (!str.trim() && !cur) continue

    if (cur && Math.abs(y - cur.y) <= Math.max(2, size * 0.6)) {
      // baris sama: sisipkan spasi bila ada jeda horizontal berarti
      const gap = x - cur.x
      cur.parts.push(gap > size * 0.3 ? ' ' + str : str)
      cur.size = Math.max(cur.size, size)
      cur.x = x
    } else {
      if (cur) lines.push({ text: cur.parts.join('').replace(/\s+/g, ' ').trim(), size: cur.size, y: cur.y, page })
      cur = { parts: [str], size, y, x }
    }
  }
  if (cur) lines.push({ text: cur.parts.join('').replace(/\s+/g, ' ').trim(), size: cur.size, y: cur.y, page })
  return lines.filter((l) => l.text.length > 0)
}

/** Ekstrak ContentBlock[] dari biner PDF. */
export async function parsePdf(data: ArrayBuffer): Promise<ContentBlock[]> {
  const pdfjs = await import('pdfjs-dist')
  // Worker terpisah (chunk sendiri) — jalankan parsing di luar main thread.
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const doc = await pdfjs.getDocument({ data }).promise
  const allLines: Line[] = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const tc = await page.getTextContent()
    const items = tc.items.filter((i): i is typeof i & { str: string } => 'str' in i) as {
      str: string
      height: number
      transform: number[]
    }[]
    allLines.push(...itemsToLines(items, p))
  }

  const bodySize = median(allLines.map((l) => l.size).filter((s) => s > 0)) || 10
  if (allLines.length === 0 || allLines.reduce((n, l) => n + l.text.length, 0) < 20) {
    throw new Error(
      'PDF ini tampaknya hasil pindai (tanpa lapisan teks). Gunakan tab Gambar (OCR) untuk mengenali teks, atau Gambar (Buku) untuk buku berbasis gambar.',
    )
  }

  const blocks: ContentBlock[] = []
  let para: string[] = []
  let prev: Line | null = null
  const flush = () => {
    const text = para.join(' ').replace(/\s+/g, ' ').trim()
    if (text) blocks.push({ kind: 'paragraph', text })
    para = []
  }

  for (const line of allLines) {
    // Heading heuristik: font jelas lebih besar dari badan teks & baris pendek.
    // Semua jadi level 2 (memicu chapter split) — sub-level PDF tak andal dideteksi.
    const isHeading = line.size >= bodySize * 1.3 && line.text.split(/\s+/).length <= 16
    const bigGap = prev && (prev.page !== line.page || Math.abs(prev.y - line.y) > bodySize * 1.8)
    if (isHeading) {
      flush()
      blocks.push({ kind: 'heading', level: 2, text: line.text })
    } else {
      if (bigGap) flush()
      para.push(line.text)
    }
    prev = line
  }
  flush()

  return blocks
}
