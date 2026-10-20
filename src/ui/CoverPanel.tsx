/**
 * Panel sampul: 3 jalur sesuai brief — tanpa sampul, auto-generate (Canvas,
 * tema dari kata kunci atau manual), atau unggah gambar kustom.
 * Pratinjau auto digambar live ke <canvas> via engine cover.
 */
import { useEffect, useRef } from 'react'
import { drawCoverToCanvas } from '@cover'
import type { ThemeId } from '@cover'
import { SegmentedOption } from './primitives'
import type { CoverMode, CustomCover } from './useConverter'

const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'classic', label: 'Klasik' },
  { id: 'religious', label: 'Religius' },
  { id: 'technical', label: 'Teknis' },
]

/** Pratinjau canvas untuk mode auto. Digambar ulang saat judul/tema berubah. */
function AutoPreview({
  title,
  author,
  theme,
}: {
  title: string
  author?: string
  theme?: ThemeId
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    // Dimensi kecil untuk pratinjau (engine skala internal via width/height canvas).
    drawCoverToCanvas(canvas, { title: title || 'Tanpa Judul', author, theme, dimensions: { width: 300, height: 450, margin: 30 } })
  }, [title, author, theme])
  return <canvas ref={ref} className="w-[150px] border-eink border-black" aria-label="Pratinjau sampul" />
}

export function CoverPanel({
  mode,
  theme,
  custom,
  title,
  author,
  onMode,
  onTheme,
  onCustomFile,
}: {
  mode: CoverMode
  theme?: ThemeId
  custom: CustomCover | null
  title: string
  author?: string
  onMode: (m: CoverMode) => void
  onTheme: (t: ThemeId) => void
  onCustomFile: (file: File) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="group" aria-label="Sumber sampul">
        <SegmentedOption active={mode === 'auto'} onClick={() => onMode('auto')}>
          Otomatis
        </SegmentedOption>
        <SegmentedOption active={mode === 'custom'} onClick={() => onMode('custom')}>
          Unggah
        </SegmentedOption>
        <SegmentedOption active={mode === 'none'} onClick={() => onMode('none')}>
          Tanpa
        </SegmentedOption>
      </div>

      {mode === 'auto' && (
        <div className="flex items-start gap-5">
          <AutoPreview title={title} author={author} theme={theme} />
          <div className="flex flex-1 flex-col gap-2">
            <span className="font-ui text-body text-ink-muted">Tema (auto-deteksi dari judul)</span>
            {THEMES.map((t) => (
              <SegmentedOption key={t.id} active={theme === t.id} onClick={() => onTheme(t.id)}>
                {t.label}
              </SegmentedOption>
            ))}
          </div>
        </div>
      )}

      {mode === 'custom' && (
        <div className="flex items-center gap-5">
          {custom ? (
            <img src={custom.previewUrl} alt="Pratinjau sampul kustom" className="w-[150px] border-eink border-black" />
          ) : (
            <div className="flex h-[225px] w-[150px] items-center justify-center border-eink border-dashed border-black font-ui text-body text-ink-faint">
              belum ada
            </div>
          )}
          <label className="btn-eink cursor-pointer">
            {custom ? 'Ganti Gambar' : 'Pilih Gambar'}
            <input
              type="file"
              accept="image/jpeg,image/png"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onCustomFile(f)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      )}

      {mode === 'none' && (
        <p className="font-ui text-body text-ink-muted">
          EPUB akan dibuat tanpa gambar sampul.
        </p>
      )}
    </div>
  )
}
