import type { Chapter, ContentBlock } from '@core/types'
import { subHeadingId } from '@core/ids'
import { XML_DECL, esc, escAttr } from './xml'
import { wrapComplexGlyphs } from './svgGlyph'

export interface RenderOptions {
  chapterId: string
  lang: string
  /** href stylesheet relatif terhadap file bab (mis. '../styles/content.css'). */
  cssHref: string
}

/**
 * Render satu bab menjadi dokumen XHTML EPUB 3.0 yang well-formed.
 * - Judul bab dirender sebagai <h1>; sub-heading (H3) diberi id anchor (subHeadingId).
 * - Zero-Bloat: hanya struktur semantik, styling di content.css.
 */
export function renderChapterXhtml(chapter: Chapter, opts: RenderOptions): string {
  const body: string[] = []
  body.push(`<h1>${wrapComplexGlyphs(esc(chapter.title))}</h1>`)

  let h3Ordinal = 0
  for (const b of chapter.blocks) {
    body.push(renderBlock(b, opts.chapterId, () => h3Ordinal++))
  }

  const dir = chapter.direction
  return [
    XML_DECL,
    '<!DOCTYPE html>',
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escAttr(opts.lang)}" xml:lang="${escAttr(opts.lang)}" dir="${dir}">`,
    '<head>',
    '  <meta charset="utf-8"/>',
    `  <title>${esc(chapter.title)}</title>`,
    `  <link rel="stylesheet" type="text/css" href="${escAttr(opts.cssHref)}"/>`,
    '</head>',
    `<body dir="${dir}">`,
    body.filter(Boolean).map((l) => `  ${l}`).join('\n'),
    '</body>',
    '</html>',
    '',
  ].join('\n')
}

/**
 * Resolusi href gambar relatif terhadap berkas bab (yang berada di `text/`).
 * Aset lokal disimpan sebagai path relatif-OEBPS (mis. `images/p1.jpg`) agar
 * konsisten dengan manifest OPF & pre-flight; dari dalam `text/chap-N.xhtml`
 * path itu perlu prefix `../`. Data URI / URL absolut dibiarkan apa adanya.
 */
function resolveImageHref(src: string): string {
  if (/^(data:|https?:|\/|\.\.?\/)/.test(src)) return src
  return `../${src}`
}

function renderBlock(b: ContentBlock, chapterId: string, nextH3: () => number): string {
  switch (b.kind) {
    case 'heading': {
      if (b.level === 3) {
        const id = subHeadingId(chapterId, b.text, nextH3())
        return `<h3 id="${escAttr(id)}">${wrapComplexGlyphs(esc(b.text))}</h3>`
      }
      // level 1/2 di dalam bab -> h2 (h1 dipakai judul bab)
      return `<h2>${wrapComplexGlyphs(esc(b.text))}</h2>`
    }
    case 'paragraph':
      // html sudah dibersihkan ke inline aman (strong/em/a/br) & well-formed.
      return `<p>${wrapComplexGlyphs(b.html ?? esc(b.text))}</p>`
    case 'list': {
      const tag = b.ordered ? 'ol' : 'ul'
      const items = b.items.map((it) => `    <li>${esc(it)}</li>`).join('\n')
      return `<${tag}>\n${items}\n  </${tag}>`
    }
    case 'image':
      return `<p><img src="${escAttr(resolveImageHref(b.src))}" alt="${escAttr(b.alt ?? '')}"/></p>`
    case 'table':
      return renderTable(b)
    case 'html':
      return b.raw
  }
}

function renderTable(b: Extract<ContentBlock, { kind: 'table' }>): string {
  const rows: string[] = []
  if (b.header && b.header.length) {
    rows.push(`    <thead><tr>${b.header.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>`)
  }
  const bodyRows = b.rows
    .map((r) => `      <tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`)
    .join('\n')
  rows.push(`    <tbody>\n${bodyRows}\n    </tbody>`)
  return `<table>\n${rows.join('\n')}\n  </table>`
}
