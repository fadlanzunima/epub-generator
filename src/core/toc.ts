import type { Chapter, TocEntry } from './types'
import { subHeadingId } from './ids'

/**
 * Bangun Streamlined / Flat TOC dari daftar bab.
 * Brief: kedalaman maksimal 2 level (Bab -> Sub-bab) agar navigasi ringan.
 *  - Level 1 = setiap bab.
 *  - Level 2 = Heading 3 di dalam bab (opsional).
 * `href` diisi oleh EPUB Engine (Fase 3) memakai id anchor yang IDENTIK
 * dengan renderer (subHeadingId), sehingga tautan nav selalu cocok.
 */
export function buildToc(chapters: Chapter[]): TocEntry[] {
  return chapters.map((chap) => {
    const children: TocEntry[] = []
    let ordinal = 0
    for (const b of chap.blocks) {
      if (b.kind === 'heading' && b.level === 3) {
        children.push({ id: subHeadingId(chap.id, b.text, ordinal), title: b.text.trim() })
        ordinal++
      }
    }
    const entry: TocEntry = { id: chap.id, title: chap.title }
    if (children.length > 0) entry.children = children
    return entry
  })
}
