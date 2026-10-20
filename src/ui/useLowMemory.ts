import { useCallback, useState } from 'react'

/**
 * Mode Hemat Memori: untuk perangkat E-Ink / ponsel RAM kecil (≤2GB).
 * Saat aktif, fitur boros memori disembunyikan/dinonaktifkan — OCR (Tesseract,
 * mengunduh & memproses data latih di RAM) dan embed font CJK (unduh 9–18MB
 * lalu subset). Default auto dari `navigator.deviceMemory`; pilihan manual
 * disimpan di localStorage.
 */
const STORAGE_KEY = 'epub-builder:low-memory'

function detectDefault(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === '1') return true
    if (stored === '0') return false
  } catch {
    /* mode privat: abaikan */
  }
  // deviceMemory dalam GB (perkiraan, dibulatkan peramban). ≤2 → aktifkan.
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  return typeof mem === 'number' && mem <= 2
}

export function useLowMemory() {
  const [on, setOn] = useState<boolean>(detectDefault)

  const toggle = useCallback(() => {
    setOn((v) => {
      const next = !v
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        /* abaikan */
      }
      return next
    })
  }, [])

  return { on, toggle }
}
