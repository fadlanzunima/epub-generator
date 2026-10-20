// Parsers: ubah sumber dokumen -> DocumentIR siap kompilasi.
import { chapterize } from '@core/chapterize'
import { detectLanguage } from '@fonts/detect'
import type { ContentBlock, DocumentIR, TextDirection } from '@core/types'
import { parseMarkdown } from './markdown'
import { parseText } from './text'
import { parseDocx } from './docx'
import { parseSpreadsheet } from './spreadsheet'
import { parsePdf } from './pdf'
import { fetchArticle, parseArticleHtml } from './url'
import { ocrImageToBlocks, type OcrOptions } from './ocr'

export { parseMarkdown } from './markdown'
export { parseText } from './text'
export { parseDocx } from './docx'
export { parseSpreadsheet } from './spreadsheet'
export { parsePdf } from './pdf'
export { htmlToBlocks } from './htmlToBlocks'
export { articleToBlocks, parseArticleHtml, fetchArticle } from './url'
export type { ArticleResult } from './url'
export { imageToText, ocrImageToBlocks } from './ocr'
export type { OcrOptions } from './ocr'
export { parseImagesToBook } from './imageBook'
export type { ImageBookOptions } from './imageBook'

/** Format sumber yang didukung. */
export type SourceFormat = 'docx' | 'markdown' | 'text' | 'csv' | 'xlsx' | 'pdf'

export interface AssembleOptions {
  baseName: string
  source?: string
  /**
   * Arah & bahasa default. Pada Fase 2, Language Detector akan menimpa nilai ini
   * (Unicode range / franc-min) sebelum konversi EPUB.
   */
  direction?: TextDirection
  language?: string
}

/** Ambil cuplikan teks (maks ~4000 char) dari blok untuk deteksi bahasa. */
function sampleText(blocks: ContentBlock[], limit = 4000): string {
  const parts: string[] = []
  let len = 0
  for (const b of blocks) {
    let t = ''
    if (b.kind === 'heading' || b.kind === 'paragraph') t = b.text
    else if (b.kind === 'list') t = b.items.join(' ')
    else if (b.kind === 'table') t = [...(b.header ?? []), ...b.rows.flat()].join(' ')
    if (!t) continue
    parts.push(t)
    len += t.length
    if (len >= limit) break
  }
  return parts.join('\n')
}

/**
 * Rakit ContentBlock[] menjadi DocumentIR lengkap (chapter-split + meta).
 * Menjalankan Language Detector (Unicode-range + franc-min) untuk mengisi
 * language/direction/script secara otomatis; override eksplisit tetap dihormati.
 * Fungsi murni — dipakai dispatcher maupun smoke test tanpa objek File.
 */
export function assembleIR(blocks: ContentBlock[], opts: AssembleOptions): DocumentIR {
  const detection = detectLanguage(`${opts.baseName}\n${sampleText(blocks)}`)
  const direction = opts.direction ?? detection.direction
  const language = opts.language ?? detection.language

  const { title, chapters } = chapterize(blocks, {
    fallbackTitle: opts.baseName,
    direction,
    introTitle: 'Pendahuluan',
  })
  return {
    meta: {
      title,
      language,
      direction,
      script: detection.script,
      source: opts.source ?? opts.baseName,
    },
    chapters,
  }
}

/** Deteksi format dari ekstensi nama file. */
export function detectFormat(filename: string): SourceFormat | null {
  const ext = filename.toLowerCase().split('.').pop() ?? ''
  switch (ext) {
    case 'docx':
      return 'docx'
    case 'md':
    case 'markdown':
      return 'markdown'
    case 'txt':
      return 'text'
    case 'csv':
      return 'csv'
    case 'xlsx':
    case 'xls':
      return 'xlsx'
    case 'pdf':
      return 'pdf'
    default:
      return null
  }
}

function baseName(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || filename
}

/**
 * Dispatcher utama: File (dari input/drag-drop) -> DocumentIR.
 * Berjalan 100% di browser; tidak ada panggilan jaringan.
 */
export async function parseFile(file: File): Promise<DocumentIR> {
  const format = detectFormat(file.name)
  if (!format) throw new Error(`Format tidak didukung: ${file.name}`)

  const bn = baseName(file.name)
  let blocks: ContentBlock[]

  switch (format) {
    case 'markdown':
      blocks = parseMarkdown(await file.text())
      break
    case 'text':
      blocks = parseText(await file.text())
      break
    case 'docx':
      blocks = (await parseDocx(await file.arrayBuffer())).blocks
      break
    case 'csv':
      blocks = await parseSpreadsheet(await file.text(), { csv: true, singleSheetTitle: bn })
      break
    case 'xlsx':
      blocks = await parseSpreadsheet(await file.arrayBuffer())
      break
    case 'pdf':
      blocks = await parsePdf(await file.arrayBuffer())
      break
  }

  return assembleIR(blocks, { baseName: bn, source: file.name })
}

/**
 * Ambil artikel dari URL (browser, via fetch + Readability) -> DocumentIR.
 * Lihat catatan CORS di fetchArticle.
 */
export async function parseUrl(url: string): Promise<DocumentIR> {
  const article = await fetchArticle(url)
  return assembleIR(article.blocks, { baseName: article.title, source: url })
}

/**
 * Parse HTML artikel yang ditempel pengguna -> DocumentIR (fallback tanpa fetch,
 * mis. saat URL diblokir CORS). 100% client-side.
 */
export function parseHtmlArticle(html: string, source = 'artikel'): DocumentIR {
  const article = parseArticleHtml(html)
  return assembleIR(article.blocks, { baseName: article.title, source })
}

/**
 * OCR gambar (browser, Tesseract.js lazy) -> DocumentIR. Lihat catatan di ocr.ts.
 */
export async function parseImageOcr(
  image: File | Blob,
  opts: OcrOptions & { baseName?: string } = {},
): Promise<DocumentIR> {
  const blocks = await ocrImageToBlocks(image, opts)
  return assembleIR(blocks, { baseName: opts.baseName ?? 'Hasil OCR', source: 'ocr' })
}
