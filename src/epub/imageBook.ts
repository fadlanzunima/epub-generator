import type { DocumentIR } from '@core/types'

export interface ImagePage {
  /** src gambar: data URI, URL, atau path aset di dalam EPUB (mis. 'images/p1.jpg'). */
  src: string
  alt?: string
}

export interface ImageBookMeta {
  title: string
  author?: string
  language?: string
}

/**
 * Image-Book Mode: susun DocumentIR dari daftar gambar, satu gambar per
 * "halaman" (bab) sehingga eReader memberi page-break alami (komik/infografis/scan).
 * Gambar diasumsikan sudah diproses Grayscale High-Contrast (lihat image.ts).
 */
export function buildImageBookIR(images: ImagePage[], meta: ImageBookMeta): DocumentIR {
  const chapters = images.map((img, i) => ({
    id: `page-${i + 1}`,
    title: `Halaman ${i + 1}`,
    direction: 'ltr' as const,
    blocks: [img.alt ? { kind: 'image' as const, src: img.src, alt: img.alt } : { kind: 'image' as const, src: img.src }],
  }))

  return {
    meta: {
      title: meta.title,
      language: meta.language ?? 'id',
      direction: 'ltr',
      script: 'unknown',
      source: 'image-book',
    },
    chapters,
  }
}
