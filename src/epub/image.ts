/**
 * Image pipeline ramah E-Ink.
 * Inti transform MURNI (bekerja pada Uint8ClampedArray RGBA) agar bisa diuji
 * di Node; wrapper browser memakai Canvas untuk decode/encode.
 */

/**
 * Konversi RGBA in-place menjadi Grayscale High-Contrast.
 * luminance (Rec. 601) -> kurva kontras -> set R=G=B. Alpha dipertahankan.
 * @param contrast 0..255 (makin tinggi makin tajam; default 80 untuk e-ink).
 */
export function grayscaleHighContrast(data: Uint8ClampedArray, contrast = 80): void {
  const c = Math.max(0, Math.min(255, contrast))
  const F = (259 * (c + 255)) / (255 * (259 - c))
  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    let v = F * (lum - 128) + 128
    v = v < 0 ? 0 : v > 255 ? 255 : v
    data[i] = data[i + 1] = data[i + 2] = v
  }
}

export interface GrayscaleOptions {
  contrast?: number
  /** Skala ulang agar sisi terpanjang <= maxEdge px (hemat ukuran EPUB). */
  maxEdge?: number
  mime?: 'image/jpeg' | 'image/png'
  quality?: number
}

/**
 * Proses sebuah gambar (Blob) menjadi Blob Grayscale High-Contrast — browser.
 * Memakai createImageBitmap + Canvas (decode/encode) tanpa server.
 */
export async function processImageToGrayscaleBlob(input: Blob, opts: GrayscaleOptions = {}): Promise<Blob> {
  const bitmap = await createImageBitmap(input)
  const maxEdge = opts.maxEdge ?? 1600
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()

  const imageData = ctx.getImageData(0, 0, w, h)
  grayscaleHighContrast(imageData.data, opts.contrast)
  ctx.putImageData(imageData, 0, 0)

  const mime = opts.mime ?? 'image/jpeg'
  const quality = opts.quality ?? 0.85
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob gagal'))), mime, quality)
  })
}
