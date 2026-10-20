import type { DocumentIR, PreflightResult } from './types'

/**
 * Pre-flight Check: validasi struktur IR sebelum konversi ke EPUB.
 * Tujuan: menangkap dokumen rusak/kosong lebih awal agar hasil tetap
 * lolos epubcheck & tidak corrupt di eReader pihak ketiga.
 */
export function preflight(ir: DocumentIR): PreflightResult {
  const warnings: string[] = []
  const errors: string[] = []

  if (!ir.meta.title?.trim()) errors.push('Judul dokumen kosong.')
  if (!ir.meta.language?.trim()) warnings.push('Kode bahasa (dc:language) belum terisi.')

  if (ir.chapters.length === 0) {
    errors.push('Tidak ada bab/konten yang bisa dikonversi.')
  }

  let totalBlocks = 0
  let hasHeading = false
  const assetPaths = new Set((ir.assets ?? []).map((a) => a.path))

  ir.chapters.forEach((chap, i) => {
    totalBlocks += chap.blocks.length
    if (chap.blocks.length === 0) warnings.push(`Bab "${chap.title || i + 1}" tidak memiliki isi.`)
    for (const b of chap.blocks) {
      if (b.kind === 'heading') hasHeading = true
      // Gambar yang menunjuk aset lokal (bukan data URI / URL) harus ada di assets.
      if (b.kind === 'image' && !/^(data:|https?:)/.test(b.src) && !assetPaths.has(b.src)) {
        warnings.push(`Gambar "${b.src}" dirujuk tapi asetnya tidak ditemukan.`)
      }
    }
  })

  if (totalBlocks === 0) errors.push('Dokumen tidak memiliki konten sama sekali.')
  if (!hasHeading && ir.chapters.length === 1) {
    warnings.push('Tidak ada heading terdeteksi — Daftar Isi akan minimal (satu bab).')
  }

  return { ok: errors.length === 0, warnings, errors }
}
