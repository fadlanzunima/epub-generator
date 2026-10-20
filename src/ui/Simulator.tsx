/**
 * Live Simulator (Fase 5): pratinjau WYSIWYG bab di layar E-Ink
 * (Kindle / Kobo / Onyx Boox) dalam bingkai perangkat, dengan kontrol
 * ukuran font. Render identik dengan EPUB nyata (memakai ulang engine).
 */
import { useMemo, useState } from 'react'
import type { Chapter, ScriptHint, TextDirection } from '@core/types'
import { DEVICES, buildPreviewDoc, type Device } from './devices'
import { SegmentedOption } from './primitives'

const DISPLAY_WIDTH = 280 // px lebar area layar (tinggi dihitung dari aspect)
const MIN_SCALE = 0.8
const MAX_SCALE = 1.6
const STEP = 0.1

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

  const srcDoc = useMemo(
    () => buildPreviewDoc(chapter, { device, script, direction, lang, fontScale }),
    [chapter, device, script, direction, lang, fontScale],
  )

  const screenHeight = Math.round(DISPLAY_WIDTH / device.aspect)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="group" aria-label="Pilih perangkat">
        {DEVICES.map((d) => (
          <SegmentedOption key={d.id} active={device.id === d.id} onClick={() => setDevice(d)}>
            {d.name}
          </SegmentedOption>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-ui text-body text-ink-muted">Ukuran font</span>
        <div className="flex items-center gap-2">
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
        <div className="border-eink border-black bg-black p-3" style={{ width: DISPLAY_WIDTH + 24 }}>
          <iframe
            title={`Pratinjau ${device.name}`}
            srcDoc={srcDoc}
            // allow-same-origin agar @font-face /fonts/ termuat (bukan cross-origin).
            // Tanpa allow-scripts: JS di konten tetap diblokir — aman dari XSS.
            sandbox="allow-same-origin"
            className="block border-0 bg-white"
            style={{ width: DISPLAY_WIDTH, height: screenHeight }}
          />
        </div>
        <span className="font-ui text-body text-ink-faint">{device.note}</span>
      </div>
    </div>
  )
}
