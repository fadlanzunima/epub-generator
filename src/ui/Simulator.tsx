/**
 * Live Simulator (Fase 5): pratinjau WYSIWYG bab di layar E-Ink
 * (Kindle / Kobo / Onyx Boox) dalam bingkai perangkat, dengan kontrol
 * ukuran font & dua mode baca: Gulir atau Halaman (page-flip ala eReader —
 * ketuk sisi layar / tombol untuk pindah halaman, tanpa scroll).
 * Render identik dengan EPUB nyata (memakai ulang engine).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Chapter, ScriptHint, TextDirection } from '@core/types'
import { DEVICES, buildPreviewDoc, type Device } from './devices'
import { SegmentedOption } from './primitives'

const DISPLAY_WIDTH = 280 // px lebar area layar (tinggi dihitung dari aspect)
const MIN_SCALE = 0.8
const MAX_SCALE = 1.6
const STEP = 0.1

type ReadMode = 'scroll' | 'page'

export function Simulator({
  chapter,
  script,
  direction,
  lang,
}: {
  chapter: Chapter
  script: ScriptHint
  direction: TextDirection
  lang: string
}) {
  const [device, setDevice] = useState<Device>(DEVICES[0])
  const [fontScale, setFontScale] = useState(1)
  const [mode, setMode] = useState<ReadMode>('scroll')
  const [page, setPage] = useState(0)
  const [pageCount, setPageCount] = useState(1)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const paged = mode === 'page'
  const rtl = direction === 'rtl'

  const srcDoc = useMemo(
    () =>
      buildPreviewDoc(chapter, {
        device,
        script,
        direction,
        lang,
        fontScale,
        paged,
        displayWidth: DISPLAY_WIDTH,
      }),
    [chapter, device, script, direction, lang, fontScale, paged],
  )

  const screenHeight = Math.round(DISPLAY_WIDTH / device.aspect)

  /** Geser body iframe ke halaman p (transform deterministik LTR & RTL). */
  const applyTransform = useCallback(
    (p: number) => {
      const body = iframeRef.current?.contentDocument?.body
      if (!body) return
      const sign = rtl ? 1 : -1
      body.style.transform = `translateX(${sign * p * DISPLAY_WIDTH}px)`
    },
    [rtl],
  )

  /** Ukur jumlah halaman setelah konten iframe termuat. */
  const measure = useCallback(() => {
    if (!paged) return
    const body = iframeRef.current?.contentDocument?.body
    if (!body) return
    const count = Math.max(1, Math.round(body.scrollWidth / DISPLAY_WIDTH))
    setPageCount(count)
    setPage((prev) => {
      const clamped = Math.min(prev, count - 1)
      applyTransform(clamped)
      return clamped
    })
  }, [paged, applyTransform])

  // Reset ke halaman pertama saat konten/mode berubah.
  useEffect(() => {
    setPage(0)
    setPageCount(1)
  }, [chapter, device, fontScale, paged])

  // Terapkan transform tiap kali halaman berpindah.
  useEffect(() => {
    if (paged) applyTransform(page)
  }, [page, paged, applyTransform])

  const goNext = useCallback(() => setPage((p) => Math.min(pageCount - 1, p + 1)), [pageCount])
  const goPrev = useCallback(() => setPage((p) => Math.max(0, p - 1)), [])

  // Ketuk sisi: LTR → kanan=maju; RTL → kiri=maju.
  const onLeftTap = rtl ? goNext : goPrev
  const onRightTap = rtl ? goPrev : goNext

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih perangkat">
        {DEVICES.map((d) => (
          <SegmentedOption key={d.id} active={device.id === d.id} onClick={() => setDevice(d)}>
            {d.name}
          </SegmentedOption>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2" role="group" aria-label="Mode baca">
          <SegmentedOption active={mode === 'scroll'} onClick={() => setMode('scroll')}>
            Gulir
          </SegmentedOption>
          <SegmentedOption active={mode === 'page'} onClick={() => setMode('page')}>
            Halaman
          </SegmentedOption>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-ui text-body text-ink-muted">Font</span>
          <button
            type="button"
            className="btn-eink min-h-tap px-4"
            onClick={() => setFontScale((s) => Math.max(MIN_SCALE, +(s - STEP).toFixed(1)))}
            disabled={fontScale <= MIN_SCALE}
            aria-label="Perkecil font"
          >
            A−
          </button>
          <span className="w-12 text-center font-ui text-body text-ink">{Math.round(fontScale * 100)}%</span>
          <button
            type="button"
            className="btn-eink min-h-tap px-4"
            onClick={() => setFontScale((s) => Math.min(MAX_SCALE, +(s + STEP).toFixed(1)))}
            disabled={fontScale >= MAX_SCALE}
            aria-label="Perbesar font"
          >
            A+
          </button>
        </div>
      </div>

      {/* Bingkai perangkat E-Ink: bezel tebal hitam, layar putih */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative border-eink border-black bg-black p-3" style={{ width: DISPLAY_WIDTH + 24 }}>
          <iframe
            ref={iframeRef}
            title={`Pratinjau ${device.name}`}
            srcDoc={srcDoc}
            onLoad={measure}
            // allow-same-origin agar @font-face /fonts/ termuat & parent bisa
            // mengukur/menggeser halaman. Tanpa allow-scripts: JS konten tetap
            // diblokir — aman dari XSS.
            sandbox="allow-same-origin"
            className="block border-0 bg-white"
            style={{ width: DISPLAY_WIDTH, height: screenHeight }}
            scrolling={paged ? 'no' : 'auto'}
          />
          {/* Zona ketuk halaman (hanya mode Halaman) — menumpuk di atas iframe. */}
          {paged && (
            <div className="absolute inset-3 flex" aria-hidden="true">
              <button
                type="button"
                className="h-full w-1/2 cursor-w-resize bg-transparent"
                onClick={onLeftTap}
                aria-label="Halaman sebelumnya"
                tabIndex={-1}
              />
              <button
                type="button"
                className="h-full w-1/2 cursor-e-resize bg-transparent"
                onClick={onRightTap}
                aria-label="Halaman berikutnya"
                tabIndex={-1}
              />
            </div>
          )}
        </div>

        {paged ? (
          <div className="flex items-center gap-3">
            <button type="button" className="btn-eink px-4" onClick={goPrev} disabled={page <= 0}>
              ‹ Prev
            </button>
            <span className="font-ui text-body text-ink">
              Hal {page + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="btn-eink px-4"
              onClick={goNext}
              disabled={page >= pageCount - 1}
            >
              Next ›
            </button>
          </div>
        ) : (
          <span className="font-ui text-body text-ink-faint">{device.note}</span>
        )}
      </div>
    </div>
  )
}
