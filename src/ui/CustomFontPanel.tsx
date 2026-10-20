/**
 * Panel unggah font kustom (brief: Custom Font Upload .ttf/.otf). Font yang
 * diunggah di-subset & disematkan ke OEBPS/fonts/ EPUB, lalu diletakkan paling
 * depan pada stack font konten. 100% client-side (FileReader).
 */
import { useState } from 'react'
import type { CustomFont } from '@fonts'

export function CustomFontPanel({
  fonts,
  onAdd,
  onRemove,
  disabled,
}: {
  fonts: CustomFont[]
  onAdd: (file: File) => Promise<unknown>
  onRemove: (id: string) => void
  disabled?: boolean
}) {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-3">
      <p className="font-ui text-body text-ink-muted">
        Unggah font sendiri (.ttf / .otf) untuk disematkan ke EPUB — berguna untuk
        skrip khusus atau gaya tipografi tertentu.
      </p>

      {fonts.length > 0 && (
        <ul className="flex flex-col gap-1">
          {fonts.map((f) => (
            <li
              key={f.asset.id}
              className="flex items-center justify-between border-eink border-black bg-white px-3 py-2"
            >
              <span className="font-ui text-body text-ink">{f.asset.family}</span>
              <button
                type="button"
                className="btn-eink px-3 py-1"
                onClick={() => onRemove(f.asset.id)}
                disabled={disabled}
                aria-label={`Hapus font ${f.asset.family}`}
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="btn-eink cursor-pointer">
        + Unggah Font (.ttf / .otf)
        <input
          type="file"
          accept=".ttf,.otf,font/ttf,font/otf"
          className="sr-only"
          disabled={disabled}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            setError(null)
            try {
              await onAdd(file)
            } catch (err) {
              setError((err as Error).message)
            }
          }}
        />
      </label>

      {error && <p className="font-ui text-body text-ink" role="alert">⚠ {error}</p>}
    </div>
  )
}
