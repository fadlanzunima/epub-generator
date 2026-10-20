/**
 * Pustaka / Menu Rekomendasi (brief: Starter Library & Public Repo Integration).
 * Tombol pintasan untuk langsung menyusun EPUB materi populer/public-domain —
 * sebagian offline (bawaan), sebagian online (fetch quran.com). Setelah dipilih,
 * alir masuk ke pipeline konversi biasa (metadata → sampul → build).
 */
import { PRESETS, type PresetItem } from '@presets'
import { Section } from './primitives'

const CATEGORY_LABEL: Record<PresetItem['category'], string> = {
  quran: 'Al-Qur’an',
  document: 'Dokumen Publik',
  classic: 'Buku Klasik',
}

export function StarterLibrary({
  busy,
  online,
  onPick,
}: {
  busy: boolean
  online: boolean
  onPick: (preset: PresetItem) => void
}) {
  return (
    <Section title="Pustaka Siap-Pakai">
      <p className="mb-3 font-ui text-body text-ink-muted">
        Pilih materi populer untuk langsung dikonversi. Tanda{' '}
        <span className="font-semibold">Online</span> perlu jaringan (ambil dari repo publik);
        selebihnya tersedia offline.
      </p>
      <ul className="flex flex-col gap-2">
        {PRESETS.map((p) => {
          const blocked = p.online && !online
          return (
          <li key={p.id}>
            <button
              type="button"
              className="flex w-full flex-col items-start gap-1 border-eink border-black bg-white p-4 text-left disabled:cursor-not-allowed disabled:bg-paper-soft"
              disabled={busy || blocked}
              title={blocked ? 'Butuh koneksi internet' : undefined}
              onClick={() => onPick(p)}
            >
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-ui text-body-lg font-semibold text-ink">{p.title}</span>
                <span className="border border-black px-1.5 font-ui text-body text-ink-muted">
                  {CATEGORY_LABEL[p.category]}
                </span>
                <span className="border border-black px-1.5 font-ui text-body text-ink-muted">
                  {p.online ? 'Online' : 'Offline'}
                </span>
                {blocked && (
                  <span className="border border-dashed border-black px-1.5 font-ui text-body text-ink">
                    Perlu koneksi
                  </span>
                )}
              </span>
              <span className="font-ui text-body text-ink-muted">{p.description}</span>
            </button>
          </li>
          )
        })}
      </ul>
    </Section>
  )
}
