import { useEffect, useState } from 'react'

/**
 * Toast notifikasi in-app ringan (Zero-Bloat: tanpa animasi, ramah E-Ink).
 * Store modul-singleton + pub/sub supaya bisa dipicu dari mana saja
 * (useConverter, panel aksi) tanpa prop-drilling.
 */
export type ToastTone = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

let seq = 0
let toasts: Toast[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

/** Tampilkan toast; auto-hilang setelah ttlMs (0 = menetap sampai ditutup). */
export function pushToast(message: string, tone: ToastTone = 'info', ttlMs = 5000): number {
  const id = ++seq
  toasts = [...toasts, { id, message, tone }]
  emit()
  if (ttlMs > 0) setTimeout(() => dismissToast(id), ttlMs)
  return id
}

export function dismissToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

/** Hook: daftar toast aktif (re-render saat berubah). */
export function useToasts(): Toast[] {
  const [, bump] = useState(0)
  useEffect(() => {
    const l = () => bump((n) => n + 1)
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])
  return toasts
}
