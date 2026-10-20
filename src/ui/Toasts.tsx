/**
 * Host toast: tumpukan notifikasi di bawah layar. Ramah E-Ink (border tegas,
 * tanpa animasi). Dibedakan via prefix teks & border (bukan warna menyilaukan).
 */
import { dismissToast, useToasts, type ToastTone } from './toast'

const PREFIX: Record<ToastTone, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '!',
  error: '✕',
}

function boxClass(tone: ToastTone): string {
  if (tone === 'success') return 'border-black bg-black text-white'
  if (tone === 'warning' || tone === 'error') return 'border-dashed border-black bg-white text-ink'
  return 'border-black bg-white text-ink'
}

export function Toasts() {
  const toasts = useToasts()
  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4"
      aria-label="Notifikasi"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full max-w-md items-start justify-between gap-3 border-eink px-4 py-3 ${boxClass(t.tone)}`}
          role={t.tone === 'error' ? 'alert' : 'status'}
        >
          <span className="font-ui text-body">
            <span className="font-bold">{PREFIX[t.tone]} </span>
            {t.message}
          </span>
          <button
            type="button"
            className={`shrink-0 font-ui text-body underline ${t.tone === 'success' ? 'text-white' : 'text-ink-muted'}`}
            onClick={() => dismissToast(t.id)}
            aria-label="Tutup notifikasi"
          >
            Tutup
          </button>
        </div>
      ))}
    </div>
  )
}
