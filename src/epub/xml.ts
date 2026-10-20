export const XML_DECL = '<?xml version="1.0" encoding="utf-8"?>'

/** Escape teks untuk konten XML. */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Escape untuk nilai atribut XML (plus kutip ganda). */
export function escAttr(s: string): string {
  return esc(s).replace(/"/g, '&quot;')
}
