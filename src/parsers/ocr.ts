import type { ContentBlock } from '@core/types'
import { parseText } from './text'

/**
 * OCR gambar -> teks (Fase 5), via Tesseract.js yang di-LAZY-LOAD hanya saat
 * dipakai (library berat ~ beberapa MB + data latih per bahasa). Berjalan di
 * Web Worker di browser.
 *
 * Catatan: Tesseract mengunduh core wasm + data latih bahasa (traineddata) dari
 * CDN jsdelivr saat pertama dipakai — satu-satunya bagian aplikasi yang tidak
 * sepenuhnya offline. Setelah terunduh, hasilnya di-cache browser.
 */
export interface OcrOptions {
  /** Bahasa Tesseract, mis. 'ind+eng' (default) atau 'ara' untuk Arab. */
  lang?: string
  /** Progres 0..100 saat tahap pengenalan teks. */
  onProgress?: (percent: number) => void
}

/** Jalankan OCR dan kembalikan teks mentah. */
export async function imageToText(image: File | Blob, opts: OcrOptions = {}): Promise<string> {
  const lang = opts.lang ?? 'ind+eng'
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker(lang, 1, {
    logger: opts.onProgress
      ? (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') opts.onProgress!(Math.round(m.progress * 100))
        }
      : undefined,
  })
  try {
    const { data } = await worker.recognize(image)
    return data.text
  } finally {
    await worker.terminate()
  }
}

/** OCR gambar -> ContentBlock[] (teks dirapikan via parseText). */
export async function ocrImageToBlocks(image: File | Blob, opts: OcrOptions = {}): Promise<ContentBlock[]> {
  const text = await imageToText(image, opts)
  return parseText(text)
}
