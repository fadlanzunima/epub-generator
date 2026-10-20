/// <reference lib="webworker" />
/**
 * Web Worker subsetting font (HarfBuzz hb-subset). Memindahkan kerja CPU berat —
 * terutama subset font **CJK** (10–18 MB) — ke luar main thread agar UI tidak
 * freeze (brief: "tanpa freeze bahkan di eReader spec rendah").
 *
 * Protokol pesan:
 *   masuk : { id, fontData: ArrayBuffer, chars: string[] }   (fontData DISALIN, bukan transfer)
 *   keluar: { id, data: ArrayBuffer }                        (hasil subset / font utuh bila gagal)
 * Gagal-aman: bila subset gagal, kembalikan fontData utuh (echo) agar EPUB tetap terbentuk.
 */
import { subsetWithHb, type HbSubsetExports } from './subset'

let hbPromise: Promise<HbSubsetExports> | null = null
async function loadHb(): Promise<HbSubsetExports> {
  if (!hbPromise) {
    hbPromise = (async () => {
      const { default: wasmUrl } = await import('harfbuzzjs/hb-subset.wasm?url')
      const res = await fetch(wasmUrl)
      const { instance } = await WebAssembly.instantiate(await res.arrayBuffer())
      return instance.exports as unknown as HbSubsetExports
    })()
  }
  return hbPromise
}

interface InMsg {
  id: number
  fontData: ArrayBuffer
  chars: string[]
}

self.onmessage = async (e: MessageEvent<InMsg>) => {
  const { id, fontData, chars } = e.data
  try {
    const exports = await loadHb()
    const out = subsetWithHb(exports, fontData, new Set(chars))
    ;(self as unknown as Worker).postMessage({ id, data: out }, [out])
  } catch {
    // Echo font utuh (transfer keluar) — pemanggil tetap dapat buffer yang valid.
    ;(self as unknown as Worker).postMessage({ id, data: fontData }, [fontData])
  }
}
