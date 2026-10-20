import { marked, type Token, type Tokens } from 'marked'
import type { ContentBlock } from '@core/types'

/**
 * Parse Markdown (.md) menjadi ContentBlock[] via lexer Marked (token-based,
 * tanpa DOM) — ringan & cepat. Inline emphasis dipertahankan sebagai HTML bersih.
 */
export function parseMarkdown(md: string): ContentBlock[] {
  const tokens = marked.lexer(md)
  const out: ContentBlock[] = []
  for (const t of tokens) mapToken(t, out)
  return out
}

function mapToken(t: Token, out: ContentBlock[]): void {
  switch (t.type) {
    case 'heading': {
      const h = t as Tokens.Heading
      const level = (h.depth <= 1 ? 1 : h.depth === 2 ? 2 : 3) as 1 | 2 | 3
      out.push({ kind: 'heading', level, text: h.text.trim() })
      return
    }
    case 'paragraph': {
      const p = t as Tokens.Paragraph
      // Paragraf berisi satu gambar -> blok image.
      const only = p.tokens?.length === 1 ? p.tokens[0] : undefined
      if (only && only.type === 'image') {
        const img = only as Tokens.Image
        out.push(img.text ? { kind: 'image', src: img.href, alt: img.text } : { kind: 'image', src: img.href })
        return
      }
      const text = p.text.trim()
      if (!text) return
      const html = marked.parseInline(p.text) as string
      const htmlTrim = html.trim()
      out.push(htmlTrim !== text ? { kind: 'paragraph', text, html: htmlTrim } : { kind: 'paragraph', text })
      return
    }
    case 'list': {
      const l = t as Tokens.List
      const items = l.items.map((it) => it.text.trim()).filter(Boolean)
      if (items.length) out.push({ kind: 'list', ordered: Boolean(l.ordered), items })
      return
    }
    case 'table': {
      const tb = t as Tokens.Table
      const header = tb.header.map((c) => c.text.trim())
      const rows = tb.rows.map((r) => r.map((c) => c.text.trim()))
      out.push({ kind: 'table', rows, header })
      return
    }
    case 'blockquote': {
      const text = (t as Tokens.Blockquote).text.trim()
      if (text) out.push({ kind: 'paragraph', text })
      return
    }
    case 'code': {
      const c = t as Tokens.Code
      if (c.text.trim()) out.push({ kind: 'html', raw: `<pre><code>${escape(c.text)}</code></pre>` })
      return
    }
    case 'space':
    case 'hr':
      return
    default: {
      const anyTok = t as { text?: string }
      if (anyTok.text?.trim()) out.push({ kind: 'paragraph', text: anyTok.text.trim() })
    }
  }
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
