import { XML_DECL, esc, escAttr } from './xml'
import type { ChapterFile, EmbeddedFont, OpfMeta } from './types'

const FONT_MIME: Record<'truetype' | 'opentype', string> = {
  truetype: 'font/ttf',
  opentype: 'font/otf',
}

export interface OpfParams {
  identifier: string
  modified: string
  meta: OpfMeta
  chapterFiles: ChapterFile[]
  fonts: EmbeddedFont[]
  hasCss: boolean
  /** href gambar sampul di dalam EPUB (Fase 3B). */
  coverImageHref?: string
  coverImageMime?: string
  /** Aset biner lokal tambahan (gambar Image-Book) untuk manifest. */
  assets?: { id: string; href: string; mime: string }[]
}

/**
 * content.opf (EPUB 3.0): metadata Dublin Core + manifest + spine.
 * page-progression-direction mengikuti arah baca (rtl untuk Arab).
 */
export function buildContentOpf(p: OpfParams): string {
  const { meta } = p
  const manifest: string[] = []
  const spine: string[] = []

  // Navigasi & TOC
  manifest.push('    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>')
  manifest.push('    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>')
  if (p.hasCss) {
    manifest.push('    <item id="css" href="styles/content.css" media-type="text/css"/>')
  }

  // Sampul (opsional, Fase 3B)
  if (p.coverImageHref) {
    manifest.push(
      `    <item id="cover-image" href="${escAttr(p.coverImageHref)}" media-type="${escAttr(
        p.coverImageMime ?? 'image/jpeg',
      )}" properties="cover-image"/>`,
    )
  }

  // Aset gambar lokal (Image-Book / gambar embed)
  for (const a of p.assets ?? []) {
    manifest.push(
      `    <item id="${escAttr(a.id)}" href="${escAttr(a.href)}" media-type="${escAttr(a.mime)}"/>`,
    )
  }

  // Bab
  for (const cf of p.chapterFiles) {
    const props = cf.properties ? ` properties="${escAttr(cf.properties)}"` : ''
    manifest.push(
      `    <item id="${escAttr(cf.id)}" href="${escAttr(cf.href)}" media-type="application/xhtml+xml"${props}/>`,
    )
    spine.push(`    <itemref idref="${escAttr(cf.id)}"/>`)
  }

  // Font
  let fontIdx = 0
  for (const font of p.fonts) {
    for (const bin of font.binaries) {
      manifest.push(
        `    <item id="font-${fontIdx++}" href="fonts/${escAttr(bin.file)}" media-type="${FONT_MIME[bin.format]}"/>`,
      )
    }
  }

  const creator = meta.author
    ? `    <dc:creator id="creator">${esc(meta.author)}</dc:creator>\n`
    : ''
  const coverMeta = p.coverImageHref ? '    <meta name="cover" content="cover-image"/>\n' : ''

  return [
    XML_DECL,
    `<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="pub-id" xml:lang="${escAttr(
      meta.language,
    )}" dir="${meta.direction}">`,
    '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">',
    `    <dc:identifier id="pub-id">${esc(p.identifier)}</dc:identifier>`,
    `    <dc:title>${esc(meta.title)}</dc:title>`,
    `    <dc:language>${esc(meta.language)}</dc:language>`,
    creator +
      `    <meta property="dcterms:modified">${esc(p.modified)}</meta>` +
      (coverMeta ? '\n' + coverMeta.trimEnd() : ''),
    '  </metadata>',
    '  <manifest>',
    manifest.join('\n'),
    '  </manifest>',
    `  <spine toc="ncx" page-progression-direction="${meta.direction}">`,
    spine.join('\n'),
    '  </spine>',
    '</package>',
    '',
  ].join('\n')
}
