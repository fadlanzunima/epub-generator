/**
 * Katalog "Menu Rekomendasi & Template Instan" (brief: Public Repo Integration
 * & Starter Library). Tiap entri menyediakan `load()` yang menghasilkan
 * DocumentIR siap-build — ada yang offline (bawaan) dan ada yang online
 * (fetch repo publik seperti quran.com).
 */
import type { DocumentIR } from '@core/types'
import { fetchJuzAmmaIR } from './quran'
import { buildUUD1945IR } from './bundled'
import { fetchWikisourceIR } from './wikisource'

export type PresetCategory = 'quran' | 'document' | 'classic'

export interface PresetItem {
  id: string
  title: string
  description: string
  category: PresetCategory
  /** true: perlu jaringan (fetch repo publik). false: tersedia offline. */
  online: boolean
  load: () => Promise<DocumentIR>
}

export const PRESETS: PresetItem[] = [
  {
    id: 'juz-amma',
    title: 'Juz Amma (Arab)',
    description: 'Surah 78–114, teks Uthmani dari quran.com. Font Naskh + RTL otomatis.',
    category: 'quran',
    online: true,
    load: () => fetchJuzAmmaIR(),
  },
  {
    id: 'juz-amma-id',
    title: 'Juz Amma + Terjemahan',
    description: 'Arab (Uthmani) beserta terjemahan Bahasa Indonesia (Kemenag) tiap ayat.',
    category: 'quran',
    online: true,
    load: () => fetchJuzAmmaIR({ withTranslation: true }),
  },
  {
    id: 'uud-1945',
    title: 'Pembukaan UUD 1945',
    description: 'Public domain, dipaket di aplikasi — tersedia offline, langsung jadi.',
    category: 'document',
    online: false,
    load: async () => buildUUD1945IR(),
  },
  {
    id: 'student-hidjo',
    title: 'Student Hidjo (Marco Kartodikromo)',
    description: 'Novel klasik Indonesia (1919), public domain — diambil dari Wikisource Indonesia.',
    category: 'classic',
    online: true,
    load: () =>
      fetchWikisourceIR({ page: 'Student Hidjo', lang: 'id', author: 'Mas Marco Kartodikromo' }),
  },
]
