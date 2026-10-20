/**
 * Transfer EPUB ke perangkat/aplikasi lain (Fase 6) — 100% client-side.
 *
 * Catatan desain: mentransfer berkas EPUB (ratusan KB–MB) via QR Code tidak
 * mungkin (kapasitas QR ~3 KB). Mekanisme transfer file yang benar di sisi klien
 * adalah **Web Share API** (bagikan ke Send-to-Kindle, email, AirDrop, Files, dll).
 * QR dipakai terpisah untuk membuka APLIKASI di perangkat lain (lihat qr.ts).
 */

/** Dukungan berbagi berkas (umumnya mobile: Android/iOS Safari). */
export function canShareFile(file: File): boolean {
  return typeof navigator !== 'undefined' && !!navigator.canShare?.({ files: [file] })
}

/** Rakit Blob EPUB menjadi File dengan mime & nama yang benar. */
export function epubBlobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: 'application/epub+zip' })
}

/**
 * Bagikan berkas EPUB lewat Web Share API.
 * Kembalikan 'shared' bila sukses, 'unsupported' bila API tak ada,
 * 'cancelled' bila pengguna membatalkan.
 */
export async function shareEpub(file: File, title: string): Promise<'shared' | 'unsupported' | 'cancelled'> {
  if (!canShareFile(file)) return 'unsupported'
  try {
    await navigator.share({ files: [file], title, text: title })
    return 'shared'
  } catch (e) {
    // AbortError = pengguna menutup sheet berbagi.
    if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
    throw e
  }
}
