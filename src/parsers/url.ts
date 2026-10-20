import { Readability } from '@mozilla/readability'
import type { ContentBlock } from '@core/types'
import { htmlToBlocks } from './htmlToBlocks'

export interface ArticleResult {
  title: string
  blocks: ContentBlock[]
  /** Nama situs / byline bila terdeteksi Readability. */
  byline?: string
}

/**
 * Ekstraksi artikel dari sebuah Document (hasil parse HTML) via Readability,
 * lalu bersihkan menjadi ContentBlock[] (Word/HTML style cleaner).
 *
 * Fungsi ini menerima Document (bukan string) agar bisa diuji di Node (jsdom)
 * maupun dipakai di browser (DOMParser) — murni DOM standar, tanpa jaringan.
 * Readability memutasi dokumen; pemanggil harus memberi dokumen yang boleh dibuang.
 */
export function articleToBlocks(doc: Document): ArticleResult {
  const article = new Readability(doc).parse()
  if (!article || !article.content) {
    throw new Error('Tidak ada konten artikel yang bisa diekstrak dari halaman ini.')
  }

  // Readability mengembalikan HTML bersih; bungkus jadi elemen untuk htmlToBlocks.
  const container = doc.createElement('div')
  container.innerHTML = article.content
  const blocks = htmlToBlocks(container)

  const title = (article.title ?? '').trim() || 'Artikel'
  // Sisipkan judul sebagai H1 bila belum ada heading pembuka.
  const hasLeadingHeading = blocks[0]?.kind === 'heading'
  if (!hasLeadingHeading) blocks.unshift({ kind: 'heading', level: 1, text: title })

  return { title, blocks, byline: article.byline?.trim() || undefined }
}

/**
 * Parse string HTML mentah (browser) menjadi artikel. Memakai DOMParser bawaan.
 */
export function parseArticleHtml(html: string): ArticleResult {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return articleToBlocks(doc)
}

/**
 * Ambil & ekstrak artikel dari URL (browser). 100% client-side via fetch.
 *
 * Catatan: fetch lintas-origin tunduk CORS — banyak situs memblokirnya tanpa
 * proxy. Bila gagal, pengguna disarankan menempel HTML/teks artikel langsung.
 */
export async function fetchArticle(url: string): Promise<ArticleResult> {
  let res: Response
  try {
    res = await fetch(url, { redirect: 'follow' })
  } catch {
    throw new Error(
      'Gagal mengambil URL (kemungkinan diblokir CORS). Salin-tempel teks/HTML artikel sebagai gantinya.',
    )
  }
  if (!res.ok) throw new Error(`URL mengembalikan status ${res.status}.`)
  const html = await res.text()
  return parseArticleHtml(html)
}
