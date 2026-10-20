/**
 * Klien subsetting off-main-thread. Mencoba Web Worker (subsetWorker) agar UI
 * tak freeze untuk font besar (CJK); bila Worker tak tersedia / gagal dibuat,
 * jatuh ke subsetFont main-thread (tetap gagal-aman mengembalikan font utuh).
 */
import { subsetFont, type SubsetRequest } from './subset'

interface Pending {
  resolve: (buf: ArrayBuffer) => void
  reject: (e: Error) => void
}

const pending = new Map<number, Pending>()
let seq = 0
let worker: Worker | null | undefined // undefined = belum dicoba, null = tak tersedia

function ensureWorker(): Worker | null {
  if (worker !== undefined) return worker
  if (typeof Worker === 'undefined') {
    worker = null
    return null
  }
  try {
    const w = new Worker(new URL('./subsetWorker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<{ id: number; data: ArrayBuffer }>) => {
      const p = pending.get(e.data.id)
      if (p) {
        pending.delete(e.data.id)
        p.resolve(e.data.data)
      }
    }
    w.onerror = () => {
      // Worker rusak (mis. gagal muat wasm): tolak semua yang tertunda & matikan.
      for (const [, p] of pending) p.reject(new Error('subset worker error'))
      pending.clear()
      try {
        w.terminate()
      } catch {
        /* abaikan */
      }
      worker = null
    }
    worker = w
  } catch {
    worker = null
  }
  return worker
}

function subsetViaWorker(req: SubsetRequest): Promise<ArrayBuffer> {
  const w = ensureWorker()
  if (!w) return Promise.reject(new Error('worker tak tersedia'))
  return new Promise<ArrayBuffer>((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    try {
      // fontData DISALIN (tanpa transfer) agar tetap utuh untuk fallback main-thread.
      w.postMessage({ id, fontData: req.fontData, chars: [...req.chars] })
    } catch (e) {
      pending.delete(id)
      reject(e as Error)
    }
  })
}

/** Subset font di Worker; fallback ke main-thread bila Worker tak ada/gagal. */
export async function subsetFontOffMain(req: SubsetRequest): Promise<ArrayBuffer> {
  if (req.chars.size === 0) return req.fontData
  try {
    return await subsetViaWorker(req)
  } catch {
    return subsetFont(req)
  }
}
