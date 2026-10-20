import { useEffect, useState } from 'react'

/**
 * Status koneksi jaringan langsung (navigator.onLine + event online/offline).
 * Dipakai untuk memberi tahu di UI saat fitur yang butuh internet (font CJK
 * on-demand, Pustaka online/quran.com, fetch URL, data latih OCR) dipakai
 * sementara perangkat sedang offline.
 */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine,
  )

  useEffect(() => {
    const up = () => setOnline(true)
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return online
}
