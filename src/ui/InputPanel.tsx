/**
 * Panel sumber masukan (Fase 5): tiga jalur — Berkas, URL/Artikel (Readability),
 * dan Gambar/OCR (Tesseract lazy). Semua 100% client-side (kecuali unduhan data
 * latih OCR & fetch URL yang tunduk CORS).
 */
import { useState } from 'react'
import { Dropzone } from './Dropzone'
import { SegmentedOption } from './primitives'

type Tab = 'file' | 'url' | 'ocr'

const OCR_LANGS: { value: string; label: string }[] = [
  { value: 'ind+eng', label: 'Indonesia + Inggris' },
  { value: 'eng', label: 'Inggris' },
  { value: 'ara', label: 'Arab' },
  { value: 'ara+eng', label: 'Arab + Inggris' },
]

export function InputPanel({
  busy,
  ocrProgress,
  onFile,
  onUrl,
  onHtml,
  onImage,
}: {
  busy: boolean
  ocrProgress: number | null
  onFile: (file: File) => void
  onUrl: (url: string) => void
  onHtml: (html: string) => void
  onImage: (file: File, lang: string) => void
}) {
  const [tab, setTab] = useState<Tab>('file')
  const [url, setUrl] = useState('')
  const [html, setHtml] = useState('')
  const [lang, setLang] = useState('ind+eng')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2" role="group" aria-label="Pilih sumber masukan">
        <SegmentedOption active={tab === 'file'} onClick={() => setTab('file')} disabled={busy}>
          Berkas
        </SegmentedOption>
        <SegmentedOption active={tab === 'url'} onClick={() => setTab('url')} disabled={busy}>
          URL / Artikel
        </SegmentedOption>
        <SegmentedOption active={tab === 'ocr'} onClick={() => setTab('ocr')} disabled={busy}>
          Gambar (OCR)
        </SegmentedOption>
      </div>

      {tab === 'file' && <Dropzone onFile={onFile} busy={busy} />}

      {tab === 'url' && (
        <div className="flex flex-col gap-4 border-eink border-black bg-white p-5">
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-body text-ink-muted">Alamat artikel (URL)</span>
            <div className="flex gap-2">
              <input
                type="url"
                inputMode="url"
                value={url}
                placeholder="https://contoh.com/artikel"
                onChange={(e) => setUrl(e.target.value)}
                className="min-h-tap flex-1 border-eink border-black bg-white px-3 font-ui text-body-lg text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-dashed"
              />
              <button
                type="button"
                className="btn-eink btn-eink--inverted px-4"
                disabled={busy || !url.trim()}
                onClick={() => onUrl(url.trim())}
              >
                Ekstrak
              </button>
            </div>
          </label>

          <div className="border-t border-paper-line pt-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-body text-ink-muted">
                …atau tempel HTML/teks artikel (bila URL diblokir CORS)
              </span>
              <textarea
                value={html}
                rows={5}
                placeholder="<article>…</article> atau teks biasa"
                onChange={(e) => setHtml(e.target.value)}
                className="border-eink border-black bg-white p-3 font-ui text-body text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-dashed"
              />
            </label>
            <button
              type="button"
              className="btn-eink mt-3"
              disabled={busy || !html.trim()}
              onClick={() => onHtml(html)}
            >
              Proses HTML
            </button>
          </div>
        </div>
      )}

      {tab === 'ocr' && (
        <div className="flex flex-col gap-4 border-eink border-black bg-white p-5">
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-body text-ink-muted">Bahasa teks pada gambar</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="min-h-tap border-eink border-black bg-white px-3 font-ui text-body-lg text-ink focus-visible:outline-none focus-visible:border-dashed"
            >
              {OCR_LANGS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>

          <label className="btn-eink btn-eink--inverted cursor-pointer">
            Pilih Gambar untuk OCR
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImage(f, lang)
                e.target.value = ''
              }}
            />
          </label>

          {busy && ocrProgress !== null && (
            <p className="font-ui text-body text-ink-muted" role="status">
              Mengenali teks… {ocrProgress}%
            </p>
          )}
          <p className="font-ui text-body text-ink-faint">
            Catatan: OCR mengunduh data latih bahasa saat pertama dipakai (sekali, lalu di-cache).
          </p>
        </div>
      )}
    </div>
  )
}
