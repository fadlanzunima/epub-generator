/**
 * Public Repo Integration (brief) — tarik teks buku public-domain dari
 * **Wikisource** via MediaWiki action API (`action=parse&prop=text`). Wikimedia
 * mengizinkan CORS (`origin=*`) sehingga bisa di-fetch langsung dari browser,
 * lalu dibersihkan memakai pipeline artikel (Readability) yang sudah ada.
 *
 * Catatan: tidak semua judul berisi teks penuh di satu halaman (sebagian Wikisource
 * memecah karya ke sub-halaman). Pilih judul yang teksnya utuh di satu halaman.
 */
import type { DocumentIR } from '@core/types'
import { assembleIR, parseArticleHtml } from '@parsers'

export interface WikisourceOptions {
  /** Judul halaman Wikisource (spasi/underscore sama saja). */
  page: string
  /** Subdomain bahasa Wikisource, mis. 'id', 'en'. */
  lang: string
  /** Judul buku untuk metadata (default = judul halaman). */
  bookTitle?: string
  author?: string
  /** Kode bahasa BCP-47 untuk <dc:language>; default auto-deteksi. */
  language?: string
}

export async function fetchWikisourceIR(opts: WikisourceOptions): Promise<DocumentIR> {
  const api =
    `https://${opts.lang}.wikisource.org/w/api.php` +
    `?action=parse&page=${encodeURIComponent(opts.page)}` +
    `&prop=text&format=json&formatversion=2&origin=*`

  let res: Response
  try {
    res = await fetch(api)
  } catch {
    throw new Error('Gagal mengambil dari Wikisource — periksa koneksi internet.')
  }
  if (!res.ok) throw new Error(`Wikisource mengembalikan status ${res.status}.`)

  const json = (await res.json()) as { parse?: { title?: string; text?: string } }
  const html = json.parse?.text
  if (!html) throw new Error('Halaman Wikisource tidak memuat konten teks.')

  const article = parseArticleHtml(html)
  const ir = assembleIR(article.blocks, {
    baseName: opts.bookTitle ?? json.parse?.title ?? article.title,
    source: `Wikisource (${opts.lang}): ${opts.page}`,
    language: opts.language,
  })
  if (opts.bookTitle) ir.meta.title = opts.bookTitle
  if (opts.author) ir.meta.author = opts.author
  return ir
}
