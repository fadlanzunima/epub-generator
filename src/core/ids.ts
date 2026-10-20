import { slugify } from './chapterize'

/**
 * Id anchor untuk sub-heading (Heading 3) di dalam sebuah bab.
 * Dipakai IDENTIK oleh renderer XHTML dan pembangun TOC agar href nav cocok
 * dengan elemen target. `ordinal` = urutan H3 dalam bab (0-based) untuk jaminan
 * keunikan meski teks sub-heading sama.
 */
export function subHeadingId(chapterId: string, text: string, ordinal: number): string {
  return `${chapterId}--${slugify(text, `sub-${ordinal + 1}`)}-${ordinal + 1}`
}
