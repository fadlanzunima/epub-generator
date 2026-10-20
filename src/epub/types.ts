import type { Chapter, DocumentMeta } from '@core/types'
import type { FontAsset } from '@fonts/fonts'

/** Satu berkas font fisik beserta binernya untuk di-embed. */
export interface FontBinary {
  file: string
  format: 'truetype' | 'opentype'
  data: ArrayBuffer
}

/** Font (metadata + biner per style) yang akan disertakan ke EPUB. */
export interface EmbeddedFont {
  asset: FontAsset
  binaries: FontBinary[]
}

/** Pemetaan satu bab ke berkas XHTML-nya di dalam EPUB. */
export interface ChapterFile {
  /** id manifest, mis. 'chap-1'. */
  id: string
  /** href relatif terhadap content.opf, mis. 'text/chap-1.xhtml'. */
  href: string
  chapter: Chapter
  /** properties manifest (mis. 'svg' bila bab memuat SVG inline). */
  properties?: string
}

/** Node generik untuk nav.xhtml & toc.ncx. */
export interface NavNode {
  title: string
  href: string
  children?: NavNode[]
}

/** Opsi build EPUB. identifier & modified disuntik pemanggil agar fungsi deterministik. */
export interface BuildEpubOptions {
  /** URN unik, mis. 'urn:uuid:...'. Browser: crypto.randomUUID(). */
  identifier: string
  /** dcterms:modified ISO tanpa milidetik, mis. '2026-10-19T00:00:00Z'. */
  modified: string
  author?: string
  fonts?: EmbeddedFont[]
  /** Gambar sampul (Fase 3B): biner + mime. Disuntik ke manifest + meta cover. */
  cover?: { data: ArrayBuffer | Uint8Array; mime: string; file?: string }
  /** Format keluaran JSZip. */
  outputType?: 'uint8array' | 'blob'
}

export interface OpfMeta extends DocumentMeta {
  author?: string
}
