import { XML_DECL, esc, escAttr } from './xml'
import type { NavNode } from './types'

export interface NavParams {
  lang: string
  dir: 'ltr' | 'rtl'
  title: string
  entries: NavNode[]
}

/** nav.xhtml (EPUB 3): Daftar Isi berbasis <nav epub:type="toc">. Maks 2 level. */
export function buildNavXhtml(p: NavParams): string {
  return [
    XML_DECL,
    '<!DOCTYPE html>',
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${escAttr(
      p.lang,
    )}" xml:lang="${escAttr(p.lang)}" dir="${p.dir}">`,
    '<head>',
    '  <meta charset="utf-8"/>',
    `  <title>${esc(p.title)}</title>`,
    '</head>',
    '<body>',
    '  <nav epub:type="toc" id="toc">',
    `    <h1>Daftar Isi</h1>`,
    renderList(p.entries, 2),
    '  </nav>',
    '</body>',
    '</html>',
    '',
  ].join('\n')
}

function renderList(entries: NavNode[], indent: number): string {
  const pad = '  '.repeat(indent)
  const items = entries
    .map((e) => {
      const link = `<a href="${escAttr(e.href)}">${esc(e.title)}</a>`
      if (e.children && e.children.length) {
        return `${pad}  <li>${link}\n${renderList(e.children, indent + 2)}\n${pad}  </li>`
      }
      return `${pad}  <li>${link}</li>`
    })
    .join('\n')
  return `${pad}<ol>\n${items}\n${pad}</ol>`
}

export interface NcxParams {
  identifier: string
  title: string
  entries: NavNode[]
}

/** toc.ncx (EPUB 2 fallback) — kompatibilitas eReader lama & Send-to-Kindle. */
export function buildNcx(p: NcxParams): string {
  let playOrder = 0
  const navMap = p.entries.map((e) => navPoint(e, () => ++playOrder)).join('\n')
  return [
    XML_DECL,
    '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">',
    '  <head>',
    `    <meta name="dtb:uid" content="${escAttr(p.identifier)}"/>`,
    '    <meta name="dtb:depth" content="2"/>',
    '    <meta name="dtb:totalPageCount" content="0"/>',
    '    <meta name="dtb:maxPageNumber" content="0"/>',
    '  </head>',
    `  <docTitle><text>${esc(p.title)}</text></docTitle>`,
    '  <navMap>',
    navMap,
    '  </navMap>',
    '</ncx>',
    '',
  ].join('\n')
}

function navPoint(node: NavNode, next: () => number): string {
  const order = next()
  const id = `np-${order}`
  const children = (node.children ?? []).map((c) => navPoint(c, next)).join('\n')
  return [
    `    <navPoint id="${id}" playOrder="${order}">`,
    `      <navLabel><text>${esc(node.title)}</text></navLabel>`,
    `      <content src="${escAttr(node.href)}"/>`,
    children,
    '    </navPoint>',
  ]
    .filter(Boolean)
    .join('\n')
}
