/**
 * Overlay onboarding (Fase 5): panduan langkah alur konversi, ramah E-Ink
 * (border tegas, tanpa animasi/spotlight). Navigasi Sebelumnya/Berikutnya.
 */
import { useState } from 'react'

interface Step {
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    title: '1 · Unggah Dokumen',
    body: 'Seret atau pilih berkas .docx, .md, .txt, .csv, .xlsx — atau tempel artikel dari URL, atau pindai gambar (OCR). Semua diproses di perangkat Anda; tidak ada yang dikirim ke server.',
  },
  {
    title: '2 · Periksa Metadata & Bab',
    body: 'Judul, penulis, bahasa, arah baca, dan skrip terdeteksi otomatis. Dokumen dipecah menjadi bab (1 berkas per bab) agar ringan di eReader.',
  },
  {
    title: '3 · Pratinjau di Simulator',
    body: 'Lihat hasil persis seperti di Kindle / Kobo / Onyx Boox, lengkap dengan font Arab/Qur\'an nyata dan ukuran huruf yang bisa diatur.',
  },
  {
    title: '4 · Sampul & Bangun',
    body: 'Pilih sampul otomatis (tema sesuai judul), unggah sendiri, atau tanpa sampul. Lalu bangun EPUB 3.0 valid — font Arab disematkan & dipangkas (subset) agar ukuran kecil.',
  },
  {
    title: '5 · Unduh atau Transfer',
    body: 'Unduh berkas, bagikan ke perangkat (Send-to-Kindle/email), atau buka aplikasi di perangkat lain via QR. Pasang sebagai aplikasi untuk akses offline penuh.',
  },
]

export function Onboarding({ onFinish }: { onFinish: () => void }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
      role="dialog"
      aria-modal="true"
      aria-label="Panduan penggunaan"
    >
      <div className="w-full max-w-md border-eink border-black bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-ui text-body text-ink-faint">
            Langkah {i + 1} / {STEPS.length}
          </span>
          <button type="button" className="font-ui text-body text-ink-muted underline" onClick={onFinish}>
            Lewati
          </button>
        </div>

        <h2 className="mb-2 font-ui text-subtitle text-ink">{step.title}</h2>
        <p className="min-h-[6rem] font-reader text-body-lg text-ink-soft">{step.body}</p>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="btn-eink flex-1"
            onClick={() => setI((n) => Math.max(0, n - 1))}
            disabled={i === 0}
          >
            Sebelumnya
          </button>
          {last ? (
            <button type="button" className="btn-eink btn-eink--inverted flex-1" onClick={onFinish}>
              Mulai
            </button>
          ) : (
            <button type="button" className="btn-eink btn-eink--inverted flex-1" onClick={() => setI((n) => n + 1)}>
              Berikutnya
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
