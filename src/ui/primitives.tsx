/**
 * Primitif UI E-Ink (Zero-Bloat): border tegas, tanpa shadow/gradient/animasi.
 * Dipakai lintas panel konversi.
 */
import type { ReactNode } from 'react'

/** Label metadata ringkas (bahasa, arah, skrip). */
export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center border-eink border-black bg-white px-2 py-0.5 font-ui text-body text-ink">
      {children}
    </span>
  )
}

/** Kotak seksi dengan judul tegas. */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="w-full border-eink border-black bg-white p-5">
      <h2 className="mb-4 font-ui text-subtitle text-ink">{title}</h2>
      {children}
    </section>
  )
}

/** Field teks berlabel. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  id,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  id: string
}) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="font-ui text-body text-ink-muted">{label}</span>
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-tap border-eink border-black bg-white px-3 font-ui text-body-lg text-ink
                   placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-dashed"
      />
    </label>
  )
}

type AlertTone = 'error' | 'warning' | 'info'

/** Pesan pre-flight / status. Dibedakan via border & prefix teks (bukan warna menyilaukan). */
export function Alert({ tone, children }: { tone: AlertTone; children: ReactNode }) {
  const box =
    tone === 'error'
      ? 'border-black bg-paper-soft'
      : tone === 'warning'
        ? 'border-dashed border-black bg-white'
        : 'border-black bg-white'
  const prefix = tone === 'error' ? '✕ ' : tone === 'warning' ? '! ' : 'ℹ '
  return (
    <div className={`border-eink ${box} px-3 py-2 font-ui text-body text-ink`} role={tone === 'error' ? 'alert' : undefined}>
      <span className="font-bold">{prefix}</span>
      {children}
    </div>
  )
}

/**
 * Tombol-kartu pilihan: judul tegas + deskripsi singkat agar mudah dimengerti
 * (dipakai untuk mode sampul/metadata). Aktif = inverted. Ramah E-Ink.
 */
export function OptionCard({
  active,
  onClick,
  title,
  desc,
  disabled,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex min-h-tap flex-1 flex-col items-start justify-center gap-0.5 border-eink border-black px-4 py-2 text-left
                  ${active ? 'bg-black text-white' : 'bg-white text-black'}
                  disabled:cursor-not-allowed disabled:border-gray-400 disabled:bg-paper-soft disabled:text-ink-faint
                  focus-visible:outline-none focus-visible:border-dashed`}
    >
      <span className="font-ui text-button">{title}</span>
      <span className={`font-ui text-body ${active ? 'text-white' : 'text-ink-muted'}`}>{desc}</span>
    </button>
  )
}

/** Pilihan segmented (radio) ala E-Ink: border tegas, aktif = inverted. */
export function SegmentedOption({
  active,
  onClick,
  children,
  disabled,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`min-h-tap flex-1 border-eink border-black px-3 font-ui text-button
                  ${active ? 'bg-black text-white' : 'bg-white text-black'}
                  disabled:text-ink-faint disabled:border-gray-400 disabled:bg-paper-soft disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:border-dashed`}
    >
      {children}
    </button>
  )
}
