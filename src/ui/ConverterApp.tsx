/**
 * Alur konversi Fase 4: Unggah -> Pratinjau & Metadata -> Sampul -> Build -> Unduh.
 * Satu layar linear, ramah E-Ink (border tegas, tanpa animasi). 100% client-side.
 */
import { InputPanel } from './InputPanel'
import { CoverPanel } from './CoverPanel'
import { Simulator } from './Simulator'
import { PwaBar } from './PwaBar'
import { TransferPanel } from './TransferPanel'
import { Onboarding } from './Onboarding'
import { Alert, Badge, Field, Section } from './primitives'
import { useConverter } from './useConverter'
import { useImmersion } from './useImmersion'
import { useOnboarding } from './useOnboarding'
import type { ScriptHint, TextDirection } from '@core/types'

const SCRIPT_LABEL: Record<ScriptHint, string> = {
  latin: 'Latin',
  arabic: 'Arab',
  cjk: 'CJK',
  cyrillic: 'Sirilik',
  javanese: 'Jawa',
  sundanese: 'Sunda',
  unknown: 'Tak dikenal',
}

function dirLabel(dir: TextDirection): string {
  return dir === 'rtl' ? 'Kanan→Kiri (RTL)' : 'Kiri→Kanan (LTR)'
}

export function ConverterApp() {
  const c = useConverter()
  const immersion = useImmersion()
  const onboarding = useOnboarding()
  const busy = c.status === 'parsing' || c.status === 'building'
  const loaded = c.ir !== null

  return (
    <main className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-6 px-5 py-8">
      {onboarding.open && <Onboarding onFinish={onboarding.finish} />}

      <header className="flex items-center justify-between gap-3">
        <div className="text-left">
          <h1 className="font-ui text-title text-ink">EPUB Builder</h1>
          <p className="font-ui text-body text-ink-muted">
            Data&nbsp;→&nbsp;eReader · Non-AI · 100% Client-Side
          </p>
        </div>
        <div className="flex gap-2">
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

      {!loaded && (
        <InputPanel
          busy={busy}
          ocrProgress={c.ocrProgress}
          onFile={c.loadFile}
          onUrl={c.loadUrl}
          onHtml={c.loadHtml}
          onImage={c.loadImage}
        />
      )}

      {c.status === 'error' && c.error && <Alert tone="error">{c.error}</Alert>}

      {loaded && c.ir && (
        <>
          <Section title="Metadata">
            <div className="flex flex-col gap-4">
              <Field id="title" label="Judul" value={c.title} onChange={c.setTitle} placeholder="Judul buku" />
              <Field id="author" label="Penulis" value={c.author} onChange={c.setAuthor} placeholder="(opsional)" />
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Bahasa: {c.ir.meta.language}</Badge>
                <Badge>Skrip: {SCRIPT_LABEL[c.ir.meta.script]}</Badge>
                <Badge>{dirLabel(c.ir.meta.direction)}</Badge>
                <Badge>{c.ir.chapters.length} bab</Badge>
              </div>
              <p className="font-ui text-body text-ink-faint">Sumber: {c.sourceName}</p>
            </div>
          </Section>

          <Section title="Daftar Bab">
            <ol className="flex flex-col gap-1">
              {c.ir.chapters.map((chap, i) => (
                <li key={chap.id} className="flex items-baseline justify-between border-b border-paper-line py-1.5 last:border-0">
                  <span className="font-ui text-body-lg text-ink">
                    <span className="text-ink-faint">{i + 1}.</span> {chap.title}
                  </span>
                  <span className="font-ui text-body text-ink-faint">{chap.blocks.length} blok</span>
                </li>
              ))}
            </ol>
          </Section>

          {c.ir.chapters[0] && (
            <Section title="Pratinjau (Live Simulator)">
              <Simulator
                chapter={c.ir.chapters[0]}
                script={c.ir.meta.script}
                direction={c.ir.meta.direction}
                lang={c.ir.meta.language}
              />
            </Section>
          )}

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
          </Section>

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
  )
}
