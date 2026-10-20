import type { DocumentIR } from '@core/types'

/**
 * Auto-Extract Cover: ambil gambar pertama dari dokumen untuk dijadikan sampul
 * (brief: salah satu dari tiga jalur pembuatan cover). Mengembalikan src gambar
 * pertama (data URI / URL / path aset) atau undefined bila dokumen tak bergambar.
 */
export function extractFirstImageSrc(ir: DocumentIR): string | undefined {
  for (const chap of ir.chapters) {
    for (const b of chap.blocks) {
      if (b.kind === 'image' && b.src) return b.src
    }
  }
  return undefined
}

/** Decode base64 → Uint8Array (browser & Node 18+ punya atob). */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export interface CoverImage {
  data: ArrayBuffer
  mime: string
}

/**
 * Resolusikan gambar pertama dokumen menjadi biner sampul siap-embed.
 * Menangani tiga bentuk `src`:
 *  - **data URI** (mis. gambar docx dari Mammoth) → decode langsung,
 *  - **path aset** (mis. Image-Book) → ambil dari `ir.assets`,
 *  - **URL http(s)** (mis. gambar artikel) → fetch (butuh online & lolos CORS).
 * Mengembalikan undefined bila tak ada gambar / gagal (pemanggil → tanpa sampul).
 */
export async function resolveFirstImageCover(ir: DocumentIR): Promise<CoverImage | undefined> {
  const src = extractFirstImageSrc(ir)
  if (!src) return undefined

  // 1) data URI
  if (src.startsWith('data:')) {
    const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(src)
    if (!m) return undefined
    const mime = m[1] || 'image/png'
    const bytes = m[2]
      ? base64ToBytes(m[3])
      : new TextEncoder().encode(decodeURIComponent(m[3]))
    return { data: bytes.buffer as ArrayBuffer, mime }
  }

  // 2) aset lokal (Image-Book / aset tersemat) — cocokkan path fleksibel.
  if (ir.assets?.length) {
    const norm = src.replace(/^\.\.\//, '').replace(/^\.\//, '').replace(/^\//, '')
    const asset = ir.assets.find(
      (a) => a.path === norm || src.endsWith(a.path) || a.path.endsWith(norm),
    )
    if (asset) return { data: await asset.data.arrayBuffer(), mime: asset.mime }
  }

  // 3) URL remote (butuh online; bisa gagal karena CORS).
  if (/^https?:/i.test(src)) {
    try {
      const res = await fetch(src)
      if (res.ok) {
        const blob = await res.blob()
        return { data: await blob.arrayBuffer(), mime: blob.type || 'image/jpeg' }
      }
    } catch {
      /* offline / CORS → jatuh ke undefined */
    }
  }

  return undefined
}
