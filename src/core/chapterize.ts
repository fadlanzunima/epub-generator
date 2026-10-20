import type { Chapter, ContentBlock, TextDirection } from './types'

/** Ubah teks bebas menjadi slug id yang aman untuk href/filename EPUB. */
export function slugify(input: string, fallback = 'bagian'): string {
  const s = input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // buang diakritik Latin
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return s || fallback
}

export interface ChapterizeOptions {
  /** Judul cadangan bila dokumen tidak punya Heading 1 (mis. nama file). */
  fallbackTitle: string
  direction: TextDirection
  /** Judul bab pembuka untuk konten sebelum H2 pertama. */
  introTitle?: string
}

export interface ChapterizeResult {
  title: string
  chapters: Chapter[]
}

/**
 * Chapter-split otomatis sesuai brief:
 *  - Heading 1 pertama -> Judul dokumen (dikonsumsi, tidak jadi isi).
 *  - Setiap Heading 2 -> memulai bab baru (Chapter Split).
 *  - Konten sebelum H2 pertama -> bab "intro" (judul = introTitle/judul dokumen).
 *  - Heading >=3 tetap menjadi isi bab (dipakai sub-TOC level 2 nanti).
 *
 * Murni fungsi (tanpa DOM), sehingga ringan & mudah diuji.
 */
export function chapterize(blocks: ContentBlock[], opts: ChapterizeOptions): ChapterizeResult {
  let title = ''
  const rest: ContentBlock[] = []

  // Ambil H1 pertama sebagai judul; sisanya diteruskan.
  for (const b of blocks) {
    if (!title && b.kind === 'heading' && b.level === 1) {
      title = b.text.trim()
      continue
    }
    rest.push(b)
  }
  if (!title) title = opts.fallbackTitle.trim() || 'Dokumen'

  const chapters: Chapter[] = []
  const usedIds = new Set<string>()
  const pushChapter = (chapTitle: string, bodyBlocks: ContentBlock[]) => {
    // Jangan buat bab kosong tanpa judul & tanpa isi.
    if (!chapTitle && bodyBlocks.length === 0) return
    let id = slugify(chapTitle, `bab-${chapters.length + 1}`)
    while (usedIds.has(id)) id = `${id}-${chapters.length + 1}`
    usedIds.add(id)
    chapters.push({ id, title: chapTitle || opts.introTitle || title, direction: opts.direction, blocks: bodyBlocks })
  }

  let currentTitle = ''
  let current: ContentBlock[] = []
  let started = false

  for (const b of rest) {
    if (b.kind === 'heading' && b.level === 2) {
      // Tutup bab sebelumnya (termasuk intro) lalu mulai bab baru.
      if (started || current.length > 0) pushChapter(currentTitle || (opts.introTitle ?? title), current)
      currentTitle = b.text.trim()
      current = []
      started = true
    } else {
      current.push(b)
      started = true
    }
  }
  if (started || current.length > 0) pushChapter(currentTitle || (opts.introTitle ?? title), current)

  // Fallback: dokumen tanpa heading sama sekali -> satu bab berisi judul dokumen.
  if (chapters.length === 0) pushChapter(title, rest)

  return { title, chapters }
}
