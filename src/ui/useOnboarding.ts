import { useCallback, useState } from 'react'

/**
 * Onboarding walkthrough (Fase 5): tampil sekali pada kunjungan pertama,
 * bisa dibuka ulang via tombol bantuan. Status disimpan di localStorage.
 */
const STORAGE_KEY = 'epub-builder:onboarded'

function hasOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true // mode privat: jangan paksa tampil berulang
  }
}

export function useOnboarding() {
  const [open, setOpen] = useState<boolean>(() => !hasOnboarded())

  const finish = useCallback(() => {
    setOpen(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* abaikan */
    }
  }, [])

  const reopen = useCallback(() => setOpen(true), [])

  return { open, finish, reopen }
}
