/**
 * Panel sampul (advanced): pilih sumber lewat kartu jelas (Buat Otomatis /
 * Unggah Gambar / Tanpa Sampul). Mode otomatis menampilkan pratinjau besar +
 * pemilih GAYA dengan thumbnail nyata tiap tema (termasuk "Otomatis dari judul").
 */
import { useEffect, useRef } from 'react'
import { drawCoverToCanvas } from '@cover'
import type { ThemeId } from '@cover'
import { OptionCard } from './primitives'
import type { CoverMode, CustomCover } from './useConverter'

/** Pilihan gaya; id undefined = otomatis (deteksi dari judul). */
const STYLES: { id: ThemeId | undefined; label: string; desc: string }[] = [
  { id: undefined, label: 'Otomatis', desc: 'Pilih gaya dari judul' },
  { id: 'classic', label: 'Klasik', desc: 'Serif — buku/novel' },
  { id: 'religious', label: 'Religius', desc: 'Bingkai — Arab/Qur’an' },
  { id: 'technical', label: 'Teknis', desc: 'Bersih — laporan/data' },
]

/** Canvas sampul yang digambar ulang saat judul/penulis/tema berubah. */
function CoverCanvas({
  title,
  author,
  theme,
  width,
  className,
}: {
  title: string
  author?: string
  theme?: ThemeId
  width: number
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    drawCoverToCanvas(canvas, {
      title: title || 'Tanpa Judul',
      author,
      theme,
      dimensions: { width: 300, height: 450, margin: 30 },
    })
  }, [title, author, theme])
  return (
    <canvas
      ref={ref}
      style={{ width }}
      className={`border-eink border-black ${className ?? ''}`}
      aria-label="Pratinjau sampul"
    />
  )
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
  onTheme: (t: ThemeId | undefined) => void
  onCustomFile: (file: File) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row" role="group" aria-label="Sumber sampul">
        <OptionCard
          active={mode === 'auto'}
          onClick={() => onMode('auto')}
          title="Buat Otomatis"
          desc="Dari judul & gaya"
        />
        <OptionCard
          active={mode === 'custom'}
          onClick={() => onMode('custom')}
          title="Unggah Gambar"
          desc="Pakai gambar sendiri"
        />
        <OptionCard
          active={mode === 'none'}
          onClick={() => onMode('none')}
          title="Tanpa Sampul"
          desc="EPUB tanpa gambar"
        />
      </div>

      {mode === 'auto' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1">
            <CoverCanvas title={title} author={author} theme={theme} width={160} />
            <span className="font-ui text-body text-ink-faint">Pratinjau</span>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-ui text-body-lg text-ink">Gaya Sampul</span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {STYLES.map((s) => {
                const active = theme === s.id
                return (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => onTheme(s.id)}
                    aria-pressed={active}
                    className={`flex min-w-0 items-center gap-3 border-eink border-black p-2 text-left
                                ${active ? 'bg-black text-white' : 'bg-white text-black'}
                                focus-visible:outline-none focus-visible:border-dashed`}
                  >
                    <span className="shrink-0">
                      <CoverCanvas title={title} theme={s.id} width={34} />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="font-ui text-button-sm sm:text-button">{s.label}</span>
                      <span className={`font-ui text-body ${active ? 'text-white' : 'text-ink-muted'}`}>
                        {s.desc}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {mode === 'custom' && (
        <div className="flex items-center gap-5">
          {custom ? (
            <img
              src={custom.previewUrl}
              alt="Pratinjau sampul kustom"
              className="w-[150px] border-eink border-black"
            />
          ) : (
            <div className="flex h-[225px] w-[150px] items-center justify-center border-eink border-dashed border-black text-center font-ui text-body text-ink-faint">
              belum ada gambar
            </div>
          )}
          <div className="flex flex-col gap-2">
            <label className="btn-eink btn-eink--inverted cursor-pointer">
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
            <span className="font-ui text-body text-ink-faint">JPG / PNG · rasio 2:3 disarankan</span>
          </div>
        </div>
      )}

      {mode === 'none' && (
        <p className="font-ui text-body text-ink-muted">EPUB akan dibuat tanpa gambar sampul.</p>
      )}
    </div>
  )
}
