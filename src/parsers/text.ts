import type { ContentBlock } from '@core/types'

/**
 * Parse plain text (.txt) menjadi paragraf.
 * Heuristik ringan: baris kosong memisahkan paragraf; baris tunggal pendek
 * di awal yang diikuti baris kosong diperlakukan sebagai Heading 1 (judul).
 */
export function parseText(txt: string): ContentBlock[] {
  const normalized = txt.replace(/\r\n?/g, '\n')
  const chunks = normalized.split(/\n{2,}/).map((c) => c.trim()).filter(Boolean)
  const out: ContentBlock[] = []

  chunks.forEach((chunk, i) => {
    const singleLine = !chunk.includes('\n')
    // Judul: paragraf pertama berupa satu baris ringkas (< 80 char).
    if (i === 0 && singleLine && chunk.length <= 80) {
      out.push({ kind: 'heading', level: 1, text: chunk })
      return
    }
    // Gabungkan baris dalam satu chunk menjadi satu paragraf (soft-wrap).
    out.push({ kind: 'paragraph', text: chunk.replace(/\n/g, ' ') })
  })

  return out
}
