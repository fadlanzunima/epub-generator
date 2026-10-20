/**
 * Alur konversi Fase 4: Unggah -> Pratinjau & Metadata -> Sampul -> Build -> Unduh.
 * Satu layar linear, ramah E-Ink (border tegas, tanpa animasi). 100% client-side.
 */
import { useEffect, useState } from 'react'
import { InputPanel } from './InputPanel'
import { StarterLibrary } from './StarterLibrary'
import { CoverPanel } from './CoverPanel'
import { CustomFontPanel } from './CustomFontPanel'
import { Simulator } from './Simulator'
import { PwaBar } from './PwaBar'
import { TransferPanel } from './TransferPanel'
import { Onboarding } from './Onboarding'
import { Alert, Badge, Field, Section, SegmentedOption } from './primitives'
import { useConverter } from './useConverter'
import { useImmersion } from './useImmersion'
import { useOnboarding } from './useOnboarding'
import { useOnline } from './useOnline'
import { useLowMemory } from './useLowMemory'
import { Toasts } from './Toasts'
import { pushToast } from './toast'
import { CJK_FONT_CHOICES } from '@fonts'
import type { ScriptHint } from '@core/types'

const SCRIPT_LABEL: Record<ScriptHint, string> = {
  latin: 'Latin',
  arabic: 'Arab',
  cjk: 'CJK',
  cyrillic: 'Sirilik',
  javanese: 'Jawa',
  sundanese: 'Sunda',
  unknown: 'Tak dikenal',
}

/** Pilihan bahasa umum (BCP-47) untuk <dc:language>. */
const LANGS: { code: string; label: string }[] = [
  { code: 'id', label: 'Indonesia' },
  { code: 'en', label: 'Inggris' },
  { code: 'ar', label: 'Arab' },
  { code: 'ms', label: 'Melayu' },
  { code: 'jv', label: 'Jawa' },
  { code: 'su', label: 'Sunda' },
  { code: 'zh', label: 'Mandarin' },
  { code: 'ja', label: 'Jepang' },
  { code: 'ko', label: 'Korea' },
  { code: 'ru', label: 'Rusia' },
  { code: 'es', label: 'Spanyol' },
  { code: 'fr', label: 'Prancis' },
  { code: 'de', label: 'Jerman' },
  { code: 'nl', label: 'Belanda' },
]

export function ConverterApp() {
  const c = useConverter()
  const immersion = useImmersion()
  const onboarding = useOnboarding()
  const online = useOnline()
  const lowMem = useLowMemory()
  const busy = c.status === 'parsing' || c.status === 'building'
  const loaded = c.ir !== null
  const isImageBook = c.ir?.meta.source === 'image-book'
  // Dual-Pane hanya bila ada pratinjau (bukan Image-Book) — jika tidak, satu kolom.
  const twoPane = loaded && !isImageBook && Boolean(c.ir?.chapters[0])

  // Bab yang sedang dipratinjau di Live Simulator (diklik dari Daftar Bab).
  const [previewIndex, setPreviewIndex] = useState(0)
  useEffect(() => setPreviewIndex(0), [c.ir])

  // Mode Hemat Memori: batalkan embed font CJK yang mungkin sudah dipilih
  // (picker-nya disembunyikan) agar build tak mengunduh font besar.
  const setCjkFontId = c.setCjkFontId
  useEffect(() => {
    if (lowMem.on) setCjkFontId(null)
  }, [lowMem.on, setCjkFontId])
  const chapterCount = c.ir?.chapters.length ?? 0
  const activeIndex = Math.min(previewIndex, Math.max(0, chapterCount - 1))

  return (
    <>
    <main
      className={`mx-auto flex min-h-full w-full flex-col gap-6 px-5 py-8 ${
        twoPane ? 'max-w-2xl lg:max-w-5xl' : 'max-w-2xl'
      }`}
    >
      {onboarding.open && <Onboarding onFinish={onboarding.finish} />}

      <header className="flex items-center justify-between gap-3">
        <div className="text-left">
          <h1 className="font-ui text-title text-ink">EPUB Builder</h1>
          <p className="font-ui text-body text-ink-muted">
            Data&nbsp;→&nbsp;eReader · Non-AI · 100% Client-Side
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn-eink px-4"
            onClick={onboarding.reopen}
            title="Panduan penggunaan"
            aria-label="Buka panduan"
          >
            ?
          </button>
          <button
            type="button"
            className={`btn-eink px-4 ${lowMem.on ? 'btn-eink--inverted' : ''}`}
            onClick={lowMem.toggle}
            aria-pressed={lowMem.on}
            title="Mode Hemat Memori: sembunyikan OCR & font CJK (untuk perangkat RAM kecil, mis. E-Ink 2GB)"
          >
            {lowMem.on ? '◼ Hemat RAM' : '◻ Hemat RAM'}
          </button>
          <button
            type="button"
            className="btn-eink px-4"
            onClick={immersion.toggle}
            aria-pressed={immersion.tone === 'grayscale'}
            title="Immersion Mode: tukar nuansa Warm Paper ↔ Grayscale"
          >
            {immersion.tone === 'grayscale' ? '◐ Grayscale' : '◑ Warm Paper'}
          </button>
        </div>
      </header>

      <PwaBar />

      {!online && (
        <Alert tone="warning">
          Sedang offline. Konversi berkas lokal, OCR, Image-Book, dan font Arab/Latin tetap jalan.
          Fitur yang butuh internet (Pustaka online, font CJK, ekstrak URL) tidak tersedia sampai
          koneksi kembali.
        </Alert>
      )}

      {!loaded && (
        <>
          <InputPanel
            busy={busy}
            online={online}
            lowMemory={lowMem.on}
            ocrProgress={c.ocrProgress}
            onFile={c.loadFile}
            onUrl={c.loadUrl}
            onHtml={c.loadHtml}
            onImage={c.loadImage}
            onImages={c.loadImages}
          />
          <StarterLibrary
            busy={busy}
            online={online}
            onPick={(p) => {
              if (p.online && !online) {
                pushToast(`"${p.title}" perlu koneksi internet (diambil dari repo publik).`, 'warning')
                return
              }
              if (p.online) {
                pushToast(`Mengambil "${p.title}" dari repo publik online…`, 'info')
              }
              c.loadPreset(p.load, p.title)
            }}
          />
        </>
      )}

      {c.status === 'error' && c.error && <Alert tone="error">{c.error}</Alert>}

      {loaded && c.ir && (
        <>
          {/* Dual-Pane: di layar lebar (tablet/PC) editor di kiri, pratinjau
              menempel di kanan; di layar sempit (HP/eReader) satu kolom. */}
          <div className={twoPane ? 'flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6' : 'flex flex-col gap-6'}>
            <div className="flex min-w-0 flex-col gap-6">
              <Section title="Metadata">
                <div className="flex flex-col gap-4">
                  <Field id="title" label="Judul" value={c.title} onChange={c.setTitle} placeholder="Judul buku" />
                  <Field id="author" label="Penulis" value={c.author} onChange={c.setAuthor} placeholder="(opsional)" />

                  <div className="flex flex-col gap-4">
                    <label htmlFor="lang" className="flex flex-col gap-1.5">
                      <span className="font-ui text-body text-ink-muted">Bahasa</span>
                      <select
                        id="lang"
                        value={c.language}
                        onChange={(e) => c.setLanguage(e.target.value)}
                        className="min-h-tap border-eink border-black bg-white px-3 font-ui text-body-lg text-ink focus-visible:outline-none focus-visible:border-dashed"
                      >
                        {!LANGS.some((l) => l.code === c.language) && (
                          <option value={c.language}>{c.language}</option>
                        )}
                        {LANGS.map((l) => (
                          <option key={l.code} value={l.code}>
                            {l.label} ({l.code})
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="flex flex-col gap-1.5">
                      <span className="font-ui text-body text-ink-muted">Arah baca</span>
                      <div className="flex gap-2">
                        <SegmentedOption active={c.direction === 'ltr'} onClick={() => c.setDirection('ltr')}>
                          Kiri→Kanan
                        </SegmentedOption>
                        <SegmentedOption active={c.direction === 'rtl'} onClick={() => c.setDirection('rtl')}>
                          Kanan→Kiri
                        </SegmentedOption>
                      </div>
                    </div>
                  </div>

                  <Field id="publisher" label="Penerbit" value={c.publisher} onChange={c.setPublisher} placeholder="(opsional)" />

                  <label htmlFor="desc" className="flex flex-col gap-1.5">
                    <span className="font-ui text-body text-ink-muted">Deskripsi / Sinopsis</span>
                    <textarea
                      id="desc"
                      value={c.description}
                      rows={3}
                      placeholder="(opsional) ringkasan singkat isi buku"
                      onChange={(e) => c.setDescription(e.target.value)}
                      className="border-eink border-black bg-white p-3 font-ui text-body text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-dashed"
                    />
                  </label>

                  <Field
                    id="subjects"
                    label="Subjek / Kategori (pisahkan dengan koma)"
                    value={c.subjects}
                    onChange={c.setSubjects}
                    placeholder="mis. novel, sejarah, Indonesia"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Skrip: {SCRIPT_LABEL[c.ir.meta.script]}</Badge>
                    <Badge>{c.ir.chapters.length} bab</Badge>
                    <Badge>Sumber: {c.sourceName}</Badge>
                  </div>
                </div>
              </Section>

              <Section title="Daftar Bab">
                {twoPane && (
                  <p className="mb-2 font-ui text-body text-ink-faint">
                    Ketuk bab untuk melihatnya di Live Simulator.
                  </p>
                )}
                <ol className="flex flex-col">
                  {c.ir.chapters.map((chap, i) => {
                    const active = twoPane && i === activeIndex
                    return (
                      <li key={chap.id} className="border-b border-paper-line last:border-0">
                        <button
                          type="button"
                          onClick={() => setPreviewIndex(i)}
                          aria-pressed={active}
                          className={`flex w-full items-baseline justify-between gap-2 px-2 py-1.5 text-left
                                      ${active ? 'bg-black text-white' : 'bg-transparent'}
                                      focus-visible:outline-none focus-visible:border-dashed focus-visible:border-eink`}
                        >
                          <span className={`font-ui text-body-lg ${active ? 'text-white' : 'text-ink'}`}>
                            <span className={active ? 'text-white' : 'text-ink-faint'}>{i + 1}.</span> {chap.title}
                          </span>
                          <span className={`shrink-0 font-ui text-body ${active ? 'text-white' : 'text-ink-faint'}`}>
                            {chap.blocks.length} blok
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </Section>

              <Section title="Sampul">
                <CoverPanel
                  mode={c.coverMode}
                  theme={c.coverTheme}
                  custom={c.customCover}
                  title={c.title}
                  author={c.author}
                  onMode={c.setCoverMode}
                  onTheme={c.setCoverTheme}
                  onCustomFile={c.setCustomCoverFile}
                />
              </Section>

              <Section title="Opsi">
                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={c.embedFonts}
                      onChange={(e) => c.setEmbedFonts(e.target.checked)}
                      className="h-5 w-5 accent-black"
                    />
                    <span className="font-ui text-body-lg text-ink">
                      Sematkan font (embed) — penting untuk skrip Arab/non-Latin
                    </span>
                  </label>
                  {c.ir.meta.script === 'cjk' && lowMem.on && (
                    <div className="border-t border-paper-line pt-4">
                      <Alert tone="warning">
                        Mode Hemat Memori aktif — embed font CJK (unduh 9–18 MB lalu subset)
                        dinonaktifkan. EPUB memakai font CJK bawaan eReader. Matikan Mode Hemat
                        Memori di atas bila ingin menyematkan font CJK.
                      </Alert>
                    </div>
                  )}
                  {c.ir.meta.script === 'cjk' && !lowMem.on && (
                    <div className="flex flex-col gap-2 border-t border-paper-line pt-4">
                      <span className="font-ui text-body-lg text-ink">
                        Font CJK (China/Jepang/Korea) — tidak dibundel, unduh saat build
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <SegmentedOption active={c.cjkFontId === null} onClick={() => c.setCjkFontId(null)} disabled={busy}>
                          Tidak embed
                        </SegmentedOption>
                        {CJK_FONT_CHOICES.map((choice) => (
                          <SegmentedOption
                            key={choice.id}
                            active={c.cjkFontId === choice.id}
                            onClick={() => c.setCjkFontId(choice.id)}
                            disabled={busy}
                          >
                            {choice.label} · ±{choice.approxMb} MB
                          </SegmentedOption>
                        ))}
                      </div>
                      <p className="font-ui text-body text-ink-faint">
                        Dipilih → font diunduh sekali dari CDN, di-subset (hasil embed kecil), lalu
                        di-cache untuk offline. "Tidak embed" memakai font CJK bawaan eReader.
                      </p>
                      {!online && c.cjkFontId !== null && (
                        <Alert tone="warning">
                          Sedang offline — font CJK tidak dapat diunduh. Jika tetap Build, EPUB
                          memakai font CJK bawaan eReader.
                        </Alert>
                      )}
                    </div>
                  )}
                  <div className="border-t border-paper-line pt-4">
                    <CustomFontPanel
                      fonts={c.customFonts}
                      onAdd={c.addCustomFont}
                      onRemove={c.removeCustomFont}
                      disabled={busy}
                    />
                  </div>
                </div>
              </Section>
            </div>

            {twoPane && c.ir.chapters[activeIndex] && (
              <div className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-8">
                <Section title="Pratinjau (Live Simulator)">
                  <Simulator
                    chapter={c.ir.chapters[activeIndex]}
                    script={c.ir.meta.script}
                    direction={c.ir.meta.direction}
                    lang={c.ir.meta.language}
                    title={c.title}
                  />
                </Section>
              </div>
            )}
          </div>

          {c.preflightResult && (c.preflightResult.errors.length > 0 || c.preflightResult.warnings.length > 0) && (
            <div className="flex flex-col gap-2">
              {c.preflightResult.errors.map((msg, i) => (
                <Alert key={`e${i}`} tone="error">{msg}</Alert>
              ))}
              {c.preflightResult.warnings.map((msg, i) => (
                <Alert key={`w${i}`} tone="warning">{msg}</Alert>
              ))}
            </div>
          )}

          {c.buildNotices.length > 0 && (
            <div className="flex flex-col gap-2">
              {c.buildNotices.map((msg, i) => (
                <Alert key={`n${i}`} tone="warning">{msg}</Alert>
              ))}
            </div>
          )}

          {c.status === 'done' && c.result ? (
            <Section title="Selesai">
              <TransferPanel
                blob={c.result.blob}
                url={c.result.url}
                fileName={c.result.fileName}
                bytes={c.result.bytes}
                title={c.title}
                onReset={c.reset}
              />
            </Section>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-eink btn-eink--inverted flex-1"
                onClick={c.build}
                disabled={busy || !(c.preflightResult?.ok ?? false)}
              >
                {c.status === 'building' ? 'Membangun EPUB…' : 'Bangun EPUB'}
              </button>
              <button type="button" className="btn-eink" onClick={c.reset} disabled={busy}>
                Reset
              </button>
            </div>
          )}
        </>
      )}

      <footer className="mt-auto pt-4 text-center font-ui text-body text-ink-faint">
        Non-AI · 100% Client-Side · Berkas · URL · OCR · Arab/Qur'an · PWA Offline
      </footer>
    </main>
    <Toasts />
    </>
  )
}
