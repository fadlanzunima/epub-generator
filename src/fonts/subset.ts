import type { DocumentIR } from '@core/types'

/**
 * Kumpulkan seluruh karakter unik yang benar-benar dipakai dokumen.
 * Dipakai untuk subsetting font agar ukuran EPUB tetap < 2 MB (brief: Resource Lean).
 */
export function collectUsedChars(ir: DocumentIR): Set<string> {
  const set = new Set<string>()
  const add = (s?: string) => {
    if (!s) return
    for (const ch of s) set.add(ch)
  }
  add(ir.meta.title)
  add(ir.meta.author)
  for (const chap of ir.chapters) {
    add(chap.title)
    for (const b of chap.blocks) {
      switch (b.kind) {
        case 'heading':
        case 'paragraph':
          add(b.text)
          break
        case 'list':
          b.items.forEach(add)
          break
        case 'table':
          b.header?.forEach(add)
          b.rows.forEach((r) => r.forEach(add))
          break
        case 'image':
          add(b.alt)
          break
        case 'html':
          add(b.raw)
          break
      }
    }
  }
  return set
}

/**
 * Bangun nilai CSS `unicode-range` dari himpunan karakter (digabung jadi rentang
 * ringkas). Berguna agar browser/eReader hanya memuat glyph yang dibutuhkan.
 */
export function buildUnicodeRange(chars: Set<string>): string {
  const cps = [...chars].map((c) => c.codePointAt(0)!).filter((n) => n >= 0x20)
  cps.sort((a, b) => a - b)
  if (cps.length === 0) return 'U+0000'

  const ranges: Array<[number, number]> = []
  let start = cps[0]
  let prev = cps[0]
  for (let i = 1; i < cps.length; i++) {
    if (cps[i] === prev + 1) {
      prev = cps[i]
      continue
    }
    ranges.push([start, prev])
    start = prev = cps[i]
  }
  ranges.push([start, prev])

  const hex = (n: number) => n.toString(16).toUpperCase().padStart(4, '0')
  return ranges.map(([a, b]) => (a === b ? `U+${hex(a)}` : `U+${hex(a)}-${hex(b)}`)).join(', ')
}

export interface SubsetRequest {
  fontData: ArrayBuffer
  chars: Set<string>
}

/**
 * Subset exports WebAssembly HarfBuzz (hb-subset) yang kita pakai.
 * Hanya fungsi yang dibutuhkan — bukan seluruh ABI.
 */
export interface HbSubsetExports {
  memory: WebAssembly.Memory
  malloc(n: number): number
  free(p: number): void
  hb_blob_create(data: number, length: number, mode: number, userData: number, destroy: number): number
  hb_blob_destroy(blob: number): void
  hb_blob_get_data(blob: number, length: number): number
  hb_blob_get_length(blob: number): number
  hb_face_create(blob: number, index: number): number
  hb_face_destroy(face: number): void
  hb_face_reference_blob(face: number): number
  hb_subset_input_create_or_fail(): number
  hb_subset_input_unicode_set(input: number): number
  hb_subset_input_destroy(input: number): void
  hb_set_add(set: number, cp: number): void
  hb_subset_or_fail(face: number, input: number): number
}

const HB_MEMORY_MODE_WRITABLE = 2

/**
 * Inti subsetting murni (tanpa I/O): jalankan hb-subset atas `fontData`,
 * pertahankan hanya glyph untuk `chars`. HarfBuzz melakukan closure GSUB/GPOS
 * otomatis sehingga shaping Arab & posisi harakat/tajwid tetap utuh.
 * Fungsi ini dipisah agar dapat diuji di Node (wasm di-instantiate pemanggil).
 */
export function subsetWithHb(exports: HbSubsetExports, fontData: ArrayBuffer, chars: Set<string>): ArrayBuffer {
  const bytes = new Uint8Array(fontData)
  const fontPtr = exports.malloc(bytes.byteLength)
  new Uint8Array(exports.memory.buffer).set(bytes, fontPtr)

  const blob = exports.hb_blob_create(fontPtr, bytes.byteLength, HB_MEMORY_MODE_WRITABLE, 0, 0)
  const face = exports.hb_face_create(blob, 0)
  exports.hb_blob_destroy(blob)

  const input = exports.hb_subset_input_create_or_fail()
  const unicodeSet = exports.hb_subset_input_unicode_set(input)
  for (const ch of chars) {
    const cp = ch.codePointAt(0)
    if (cp !== undefined) exports.hb_set_add(unicodeSet, cp)
  }

  const subsetFace = exports.hb_subset_or_fail(face, input)
  exports.hb_subset_input_destroy(input)

  if (!subsetFace) {
    exports.hb_face_destroy(face)
    exports.free(fontPtr)
    throw new Error('hb_subset_or_fail: subset gagal (font mungkin rusak)')
  }

  const resultBlob = exports.hb_face_reference_blob(subsetFace)
  const offset = exports.hb_blob_get_data(resultBlob, 0)
  const length = exports.hb_blob_get_length(resultBlob)
  // Salin keluar SEBELUM destroy (memori wasm akan dibebaskan).
  const out = new Uint8Array(exports.memory.buffer).slice(offset, offset + length)

  exports.hb_blob_destroy(resultBlob)
  exports.hb_face_destroy(subsetFace)
  exports.hb_face_destroy(face)
  exports.free(fontPtr)

  if (length === 0) throw new Error('hb-subset: hasil kosong')
  return out.buffer
}

/** Muat & instantiate hb-subset.wasm sekali (lazy, browser). Dibagikan antar panggilan. */
let hbExportsPromise: Promise<HbSubsetExports> | null = null
async function loadHb(): Promise<HbSubsetExports> {
  if (!hbExportsPromise) {
    hbExportsPromise = (async () => {
      // Vite menyajikan wasm sebagai aset URL; di-lazy agar tidak membebani muat awal.
      const { default: wasmUrl } = await import('harfbuzzjs/hb-subset.wasm?url')
      const res = await fetch(wasmUrl)
      const { instance } = await WebAssembly.instantiate(await res.arrayBuffer())
      return instance.exports as unknown as HbSubsetExports
    })()
  }
  return hbExportsPromise
}

/**
 * Subset font (browser) via HarfBuzz hb-subset — memangkas glyph yang tak dipakai
 * agar EPUB tetap ringan (brief: Resource Lean). Khusus Qur'an/Arab, LPMQ ~204KB
 * bisa turun ke ~30% tanpa merusak harakat (GSUB/GPOS dipertahankan).
 *
 * Gagal-aman: bila wasm/subset gagal, kembalikan font utuh agar EPUB tetap terbentuk.
 */
export async function subsetFont(req: SubsetRequest): Promise<ArrayBuffer> {
  if (req.chars.size === 0) return req.fontData
  try {
    const exports = await loadHb()
    return subsetWithHb(exports, req.fontData, req.chars)
  } catch (e) {
    console.warn(`[subset] lewati subsetting (pakai font utuh): ${(e as Error).message}`)
    return req.fontData
  }
}
