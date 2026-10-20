/**
 * Notifikasi sistem (Web Notifications API) — memberi tahu saat EPUB selesai
 * dibuat meski tab di-background/diminimalkan. 100% client-side; opsional &
 * graceful bila tak didukung atau izin ditolak.
 */
export function canNotify(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

/** Minta izin notifikasi (idealnya dipanggil dari gesture pengguna, mis. klik Build). */
export async function ensureNotifyPermission(): Promise<NotificationPermission> {
  if (!canNotify()) return 'denied'
  if (Notification.permission === 'default') {
    try {
      return await Notification.requestPermission()
    } catch {
      return 'denied'
    }
  }
  return Notification.permission
}

/** Tampilkan notifikasi sistem "EPUB selesai" — hanya bila izin diberikan. */
export function notifyBuildDone(title: string, bytes: number): void {
  if (!canNotify() || Notification.permission !== 'granted') return
  const kb = bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`
  try {
    new Notification('EPUB Builder', {
      body: `"${title}" selesai dibuat · ${kb}. Siap diunduh / dikirim.`,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
      tag: 'epub-build',
    })
  } catch {
    /* abaikan */
  }
}
