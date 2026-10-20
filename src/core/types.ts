/**
 * Intermediate Representation (IR) dokumen — kontrak bersama seluruh pipeline.
 *
 * Alur: Parser (docx/md/csv/url/ocr) -> DocumentIR -> EPUB Engine (JSZip).
 * IR sengaja netral-format agar compiler ringan & modular (event-driven),
 * sesuai batasan brief: < 50MB RAM, < 1-2 dtk, tanpa dependensi berat di jalur inti.
 */

/** Arah baca; ditentukan oleh language detector (Unicode range / franc-min). */
export type TextDirection = 'ltr' | 'rtl'

/** Skrip dominan terdeteksi — memandu pemilihan font embed. */
export type ScriptHint = 'latin' | 'arabic' | 'cjk' | 'cyrillic' | 'javanese' | 'sundanese' | 'unknown'

/** Satu blok konten dalam sebuah bab (sudah dibersihkan dari style Word). */
export type ContentBlock =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  /** `html` menyimpan inline emphasis bersih (b/i/a) bila ada; `text` versi polos. */
  | { kind: 'paragraph'; text: string; html?: string }
  | { kind: 'list'; ordered: boolean; items: string[] }
  | { kind: 'image'; src: string; alt?: string }
  | { kind: 'table'; rows: string[][]; header?: string[] }
  | { kind: 'html'; raw: string }

/** Satu bab EPUB (hasil chapter-split; menjadi 1 file XHTML terpisah). */
export interface Chapter {
  id: string
  title: string
  direction: TextDirection
  blocks: ContentBlock[]
}

/** Metadata dublin-core untuk content.opf. */
export interface DocumentMeta {
  title: string
  author?: string
  language: string // kode BCP-47, mis. 'id', 'ar', 'en'
  direction: TextDirection
  script: ScriptHint
  source?: string // nama file / URL asal
  /** dc:publisher — penerbit (opsional). */
  publisher?: string
  /** dc:description — deskripsi/sinopsis (opsional). */
  description?: string
  /** dc:subject — daftar subjek/kategori/tag (opsional). */
  subjects?: string[]
}

/** Representasi lengkap dokumen siap dirakit menjadi EPUB. */
export interface DocumentIR {
  meta: DocumentMeta
  chapters: Chapter[]
  /** Aset biner (gambar/font) dikumpulkan terpisah agar hemat memori. */
  assets?: Array<{ path: string; mime: string; data: Blob }>
}

/**
 * Entri Daftar Isi (Streamlined / Flat TOC).
 * Brief: maksimal 2 level (Bab + Sub-bab) agar navigasi ringan di eReader low-spec.
 */
export interface TocEntry {
  id: string
  title: string
  /** href file XHTML (diisi EPUB Engine, mis. 'text/chap-1.xhtml#sub-2'). */
  href?: string
  children?: TocEntry[]
}

/** Hasil Pre-flight Check sebelum konversi. */
export interface PreflightResult {
  ok: boolean
  warnings: string[]
  errors: string[]
}
