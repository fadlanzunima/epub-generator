import JSZip from 'jszip'
import type { DocumentIR } from '@core/types'
import { subHeadingId } from '@core/ids'
import { buildContentCss } from '@fonts/css'
import { CONTAINER_XML } from './container'
import { renderChapterXhtml } from './render'
import { buildContentOpf } from './opf'
import { buildNavXhtml, buildNcx } from './nav'
import type { BuildEpubOptions, ChapterFile, EmbeddedFont, NavNode } from './types'

/** Bangun daftar node TOC (maks 2 level) dari bab + berkasnya. */
function toNavNodes(chapterFiles: ChapterFile[]): NavNode[] {
  return chapterFiles.map((cf) => {
    const children: NavNode[] = []
    let ord = 0
    for (const b of cf.chapter.blocks) {
      if (b.kind === 'heading' && b.level === 3) {
        children.push({
          title: b.text.trim(),
          href: `${cf.href}#${subHeadingId(cf.chapter.id, b.text, ord)}`,
        })
        ord++
      }
    }
    const node: NavNode = { title: cf.chapter.title, href: cf.href }
    if (children.length) node.children = children
    return node
  })
}

/**
 * Rakit DocumentIR menjadi berkas EPUB 3.0 lengkap via JSZip.
 * Struktur: mimetype (stored) · META-INF/container.xml · OEBPS/{content.opf,
 * nav.xhtml, toc.ncx, styles/, text/chap-N.xhtml, fonts/}.
 *
 * Chapter-based splitting: 1 berkas XHTML per bab (hemat RAM eReader).
 * Semua perakitan di RAM browser; tanpa server.
 */
export async function buildEpub(ir: DocumentIR, opts: BuildEpubOptions): Promise<Uint8Array | Blob> {
  const fonts: EmbeddedFont[] = opts.fonts ?? []

  const chapterFiles: ChapterFile[] = ir.chapters.map((chapter, i) => ({
    id: `chap-${i + 1}`,
    href: `text/chap-${i + 1}.xhtml`,
    chapter,
  }))

  const css = buildContentCss(
    { script: ir.meta.script, direction: ir.meta.direction },
    fonts.map((f) => f.asset),
    '../fonts/',
  )

  const navNodes = toNavNodes(chapterFiles)

  // Sampul (opsional)
  let coverImageHref: string | undefined
  let coverImageMime: string | undefined
  if (opts.cover) {
    const file = opts.cover.file ?? (opts.cover.mime === 'image/png' ? 'cover.png' : 'cover.jpg')
    coverImageHref = `images/${file}`
    coverImageMime = opts.cover.mime
  }

  const opf = buildContentOpf({
    identifier: opts.identifier,
    modified: opts.modified,
    meta: { ...ir.meta, author: opts.author },
    chapterFiles,
    fonts,
    hasCss: Boolean(css),
    coverImageHref,
    coverImageMime,
  })
  const nav = buildNavXhtml({ lang: ir.meta.language, dir: ir.meta.direction, title: ir.meta.title, entries: navNodes })
  const ncx = buildNcx({ identifier: opts.identifier, title: ir.meta.title, entries: navNodes })

  // --- Rakit ZIP ---
  const zip = new JSZip()
  // mimetype WAJIB entri pertama & tanpa kompresi (OCF spec).
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file('META-INF/container.xml', CONTAINER_XML)

  const oebps = zip.folder('OEBPS')!
  oebps.file('content.opf', opf)
  oebps.file('nav.xhtml', nav)
  oebps.file('toc.ncx', ncx)
  if (css) oebps.file('styles/content.css', css)

  for (const cf of chapterFiles) {
    oebps.file(
      cf.href,
      renderChapterXhtml(cf.chapter, {
        chapterId: cf.chapter.id,
        lang: ir.meta.language,
        cssHref: '../styles/content.css',
      }),
    )
  }

  for (const font of fonts) {
    for (const bin of font.binaries) {
      oebps.file(`fonts/${bin.file}`, bin.data)
    }
  }

  if (opts.cover && coverImageHref) {
    oebps.file(coverImageHref, opts.cover.data)
  }

  return zip.generateAsync({
    type: opts.outputType ?? 'uint8array',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  }) as Promise<Uint8Array | Blob>
}
