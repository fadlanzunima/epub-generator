/**
 * Banner status PWA (Fase 6): prompt instalasi, pemberitahuan update,
 * dan indikator siap-offline. Ramah E-Ink (border tegas, tanpa animasi).
 */
import { usePwa } from '@pwa'
import { Alert } from './primitives'

export function PwaBar() {
  const pwa = usePwa()

  return (
    <div className="flex flex-col gap-2">
      {pwa.needRefresh && (
        <div className="flex items-center justify-between gap-3 border-eink border-black bg-paper-soft px-3 py-2">
          <span className="font-ui text-body text-ink">Versi baru tersedia.</span>
          <div className="flex gap-2">
            <button type="button" className="btn-eink btn-eink--inverted min-h-tap px-4" onClick={pwa.applyUpdate}>
              Perbarui
            </button>
            <button type="button" className="btn-eink min-h-tap px-4" onClick={pwa.dismissNeedRefresh}>
              Nanti
            </button>
          </div>
        </div>
      )}

      {pwa.offlineReady && (
        <div className="flex items-center justify-between gap-3">
          <Alert tone="info">Siap digunakan offline.</Alert>
          <button type="button" className="btn-eink min-h-tap px-4" onClick={pwa.dismissOfflineReady}>
            Tutup
          </button>
        </div>
      )}

      {pwa.canInstall && !pwa.installed && (
        <div className="flex items-center justify-between gap-3 border-eink border-black bg-white px-3 py-2">
          <span className="font-ui text-body text-ink">Pasang aplikasi untuk akses cepat & offline.</span>
          <button type="button" className="btn-eink btn-eink--inverted min-h-tap px-4" onClick={pwa.install}>
            Pasang
          </button>
        </div>
      )}
    </div>
  )
}
