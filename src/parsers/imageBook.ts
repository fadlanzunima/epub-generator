/**
 * Image-Book Mode (browser): ubah daftar gambar (komik/infografis/scan) menjadi
 * DocumentIR satu-gambar-per-halaman. Tiap gambar dioptimalkan Grayscale
 * High-Contrast & dibatasi ukuran (Resource Lean) sebelum disematkan sebagai
 * aset lokal EPUB. 100% client-side (Canvas), tanpa server.
 */
import { buildImageBookIR, processImageToGrayscaleBlob, type ImagePage } from '@epub'
import type { DocumentIR } from '@core/types'

export interface ImageBookOptions {
  title?: string
  author?: string
  /** Kontras grayscale 0..255 (default 80, ramah E-Ink). */
  contrast?: number
  /** Sisi terpanjang maksimum (px) agar EPUB tetap ringan. */
  maxEdge?: number
}

/** Nama dasar dari nama file (tanpa ekstensi, rapi). */
function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || filename
}

/**
 * Proses File[] gambar -> DocumentIR Image-Book lengkap dengan assets.
 * Konvensi path aset relatif-OEBPS (`images/pN.jpg`) = `src` blok gambar, agar
 * konsisten dengan manifest OPF & pre-flight (render.ts menambah `../`).
 */
export async function parseImagesToBook(files: File[], opts: ImageBookOptions = {}): Promise<DocumentIR> {
  if (files.length === 0) throw new Error('Tidak ada gambar yang dipilih untuk Image-Book.')

  const pages: ImagePage[] = []
  const assets: NonNullable<DocumentIR['assets']> = []

  let i = 0
  for (const file of files) {
    i++
    const blob = await processImageToGrayscaleBlob(file, {
      contrast: opts.contrast ?? 80,
      maxEdge: opts.maxEdge ?? 1600,
      mime: 'image/jpeg',
    })
    const path = `images/p${i}.jpg`
    assets.push({ path, mime: 'image/jpeg', data: blob })
    pages.push({ src: path, alt: baseName(file.name) })
  }

  const title = opts.title?.trim() || baseName(files[0].name) || 'Buku Gambar'
  const ir = buildImageBookIR(pages, { title, author: opts.author })
  ir.assets = assets
  return ir
}
