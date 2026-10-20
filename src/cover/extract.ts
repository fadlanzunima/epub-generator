import type { DocumentIR } from '@core/types'

/**
 * Auto-Extract Cover: ambil gambar pertama dari dokumen untuk dijadikan sampul
 * (brief: salah satu dari tiga jalur pembuatan cover). Mengembalikan src gambar
 * pertama (data URI / URL / path aset) atau undefined bila dokumen tak bergambar.
 */
export function extractFirstImageSrc(ir: DocumentIR): string | undefined {
  for (const chap of ir.chapters) {
    for (const b of chap.blocks) {
      if (b.kind === 'image' && b.src) return b.src
    }
  }
  return undefined
}
