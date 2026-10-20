import { useCallback, useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * PWA lifecycle (Fase 6): registrasi Service Worker + status update/offline,
 * dan prompt instalasi (Add to Home Screen). Semua client-side.
 */

/** Event beforeinstallprompt (tidak ada di lib.dom standar). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePwa() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault() // tahan prompt bawaan; tampilkan tombol kita sendiri.
      setInstallEvt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallEvt(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  /** Tampilkan prompt instalasi native; kembalikan true bila diterima. */
  const install = useCallback(async (): Promise<boolean> => {
    if (!installEvt) return false
    await installEvt.prompt()
    const { outcome } = await installEvt.userChoice
    setInstallEvt(null)
    return outcome === 'accepted'
  }, [installEvt])

  const applyUpdate = useCallback(() => updateServiceWorker(true), [updateServiceWorker])

  return {
    /** true: konten sudah di-cache, aplikasi siap dipakai offline. */
    offlineReady,
    dismissOfflineReady: () => setOfflineReady(false),
    /** true: versi baru SW tersedia, menunggu reload. */
    needRefresh,
    dismissNeedRefresh: () => setNeedRefresh(false),
    applyUpdate,
    /** true: prompt instalasi tersedia (belum terpasang). */
    canInstall: installEvt !== null,
    installed,
    install,
  }
}
