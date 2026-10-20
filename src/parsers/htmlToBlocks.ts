import type { ContentBlock } from '@core/types'

/** Tag inline yang boleh dipertahankan (emphasis bersih, bukan style keras Word). */
const INLINE_KEEP = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'SUP', 'SUB', 'A', 'BR', 'SPAN', 'CODE'])

/**
 * Ubah subtree DOM (hasil Mammoth/Readability) menjadi ContentBlock[] yang bersih.
 * Bekerja di browser (DOMParser) maupun Node (jsdom) — hanya pakai API DOM standar.
 *
 * "Word style cleaner": membuang atribut style/class/font, hanya menyisakan
 * struktur semantik + inline emphasis ringan.
 */
export function htmlToBlocks(root: Element): ContentBlock[] {
  const blocks: ContentBlock[] = []
  for (const node of Array.from(root.children)) {
    collect(node, blocks)
  }
  return blocks
}

function collect(el: Element, out: ContentBlock[]): void {
  const tag = el.tagName.toUpperCase()

  switch (tag) {
    case 'H1':
      pushHeading(el, 1, out)
      return
    case 'H2':
      pushHeading(el, 2, out)
      return
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6':
      pushHeading(el, 3, out)
      return
    case 'P': {
      const img = el.querySelector('img')
      const text = (el.textContent ?? '').trim()
      if (!text && img) {
        pushImage(img, out)
        return
      }
      if (!text) return // paragraf kosong dibuang
      const html = cleanInline(el)
      out.push(html !== text ? { kind: 'paragraph', text, html } : { kind: 'paragraph', text })
      return
    }
    case 'IMG':
      pushImage(el, out)
      return
    case 'UL':
    case 'OL': {
      const items = Array.from(el.querySelectorAll(':scope > li'))
        .map((li) => (li.textContent ?? '').trim())
        .filter(Boolean)
      if (items.length) out.push({ kind: 'list', ordered: tag === 'OL', items })
      return
    }
    case 'TABLE':
      pushTable(el, out)
      return
    case 'DIV':
    case 'SECTION':
    case 'ARTICLE':
      // Kontainer: turun satu level agar isinya tetap terstruktur.
      for (const child of Array.from(el.children)) collect(child, out)
      return
    case 'BLOCKQUOTE': {
      const text = (el.textContent ?? '').trim()
      if (text) out.push({ kind: 'paragraph', text })
      return
    }
    default: {
      const text = (el.textContent ?? '').trim()
      if (text) out.push({ kind: 'paragraph', text })
    }
  }
}

function pushHeading(el: Element, level: 1 | 2 | 3, out: ContentBlock[]): void {
  const text = (el.textContent ?? '').trim()
  if (text) out.push({ kind: 'heading', level, text })
}

function pushImage(img: Element, out: ContentBlock[]): void {
  const src = img.getAttribute('src')
  if (!src) return
  const alt = img.getAttribute('alt') ?? undefined
  out.push(alt ? { kind: 'image', src, alt } : { kind: 'image', src })
}

function pushTable(table: Element, out: ContentBlock[]): void {
  const rowsEls = Array.from(table.querySelectorAll('tr'))
  if (rowsEls.length === 0) return
  const rowToCells = (tr: Element) =>
    Array.from(tr.querySelectorAll('th,td')).map((c) => (c.textContent ?? '').trim())

  let header: string[] | undefined
  let bodyStart = 0
  const firstHasTh = rowsEls[0].querySelector('th') !== null
  if (firstHasTh) {
    header = rowToCells(rowsEls[0])
    bodyStart = 1
  }
  const rows = rowsEls.slice(bodyStart).map(rowToCells)
  out.push(header ? { kind: 'table', rows, header } : { kind: 'table', rows })
}

/** Ambil innerHTML tapi hanya pertahankan tag inline yang diizinkan. */
function cleanInline(el: Element): string {
  const parts: string[] = []
  for (const node of Array.from(el.childNodes)) {
    parts.push(serializeInline(node))
  }
  return parts.join('').trim()
}

function serializeInline(node: ChildNode): string {
  if (node.nodeType === 3 /* TEXT_NODE */) return escapeText(node.textContent ?? '')
  if (node.nodeType !== 1 /* ELEMENT_NODE */) return ''
  const el = node as Element
  const tag = el.tagName.toUpperCase()
  const inner = Array.from(el.childNodes).map(serializeInline).join('')
  if (!INLINE_KEEP.has(tag)) return inner // buang wrapper tak dikenal, simpan isinya
  if (tag === 'BR') return '<br/>'
  if (tag === 'A') {
    const href = el.getAttribute('href')
    return href ? `<a href="${escapeAttr(href)}">${inner}</a>` : inner
  }
  if (tag === 'SPAN') return inner // span tanpa makna semantik: buang tag
  // Pertahankan tag semantik apa adanya (strong/em/u/sup/sub/code) — konsisten
  // dengan output Marked, lebih baik untuk aksesibilitas EPUB daripada b/i.
  const outTag = tag.toLowerCase()
  return `<${outTag}>${inner}</${outTag}>`
}

function escapeText(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeAttr(s: string): string {
  return escapeText(s).replace(/"/g, '&quot;')
}
