import { useCallback, useEffect, useState } from 'react'

/**
 * Immersion Mode (Fase 5): tukar nuansa UI secara instan antara
 * "Warm Paper" (hangat, default) dan "Pure Grayscale High-Contrast".
 * Menyetel atribut `data-tone` di <html>; token CSS di styles/index.css
 * yang menangani pergantian palet (tanpa animasi — ramah E-Ink).
 */
export type Tone = 'warm' | 'grayscale'

const STORAGE_KEY = 'epub-builder:tone'

function readInitial(): Tone {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'grayscale' ? 'grayscale' : 'warm'
  } catch {
    return 'warm'
  }
}

export function useImmersion() {
  const [tone, setTone] = useState<Tone>(readInitial)

  useEffect(() => {
    const root = document.documentElement
    // 'warm' = default (tanpa atribut); 'grayscale' mengaktifkan override token.
    if (tone === 'grayscale') root.setAttribute('data-tone', 'grayscale')
    else root.removeAttribute('data-tone')
    try {
      localStorage.setItem(STORAGE_KEY, tone)
    } catch {
      /* mode privat: abaikan */
    }
  }, [tone])

  const toggle = useCallback(() => setTone((t) => (t === 'warm' ? 'grayscale' : 'warm')), [])

  return { tone, toggle }
}
