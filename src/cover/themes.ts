/**
 * Preset gaya cover (Topic/Category Preset Matching, Non-AI via kata kunci judul).
 * Semua palet grayscale High-Contrast agar ramah E-Ink (tanpa warna menyilaukan).
 */
export type ThemeId = 'religious' | 'technical' | 'classic'

export interface CoverTheme {
  id: ThemeId
  /** Warna latar & teks (grayscale). */
  background: string
  foreground: string
  /** Family untuk judul & author. */
  titleFont: string
  bodyFont: string
  titleAlign: 'center' | 'left'
  /** Ornamen ringan: bingkai ganda (religious), garis aturan (technical), polos (classic). */
  ornament: 'frame' | 'rule' | 'plain'
  /** Huruf besar untuk judul? */
  uppercaseTitle: boolean
}

const THEMES: Record<ThemeId, CoverTheme> = {
  religious: {
    id: 'religious',
    background: '#FFFFFF',
    foreground: '#000000',
    titleFont: '"Amiri Quran", "Scheherazade New", serif',
    bodyFont: '"Amiri Quran", serif',
    titleAlign: 'center',
    ornament: 'frame',
    uppercaseTitle: false,
  },
  technical: {
    id: 'technical',
    background: '#FFFFFF',
    foreground: '#000000',
    titleFont: '"Inter", "Roboto", sans-serif',
    bodyFont: '"Inter", sans-serif',
    titleAlign: 'left',
    ornament: 'rule',
    uppercaseTitle: true,
  },
  classic: {
    id: 'classic',
    background: '#F8F6F0',
    foreground: '#000000',
    titleFont: '"Literata", "Georgia", serif',
    bodyFont: '"Literata", serif',
    titleAlign: 'center',
    ornament: 'plain',
    uppercaseTitle: false,
  },
}

const RELIGIOUS_KW = [
  'quran', "qur'an", 'qur’an', 'al-', 'juz', 'amma', 'surah', 'surat', 'ayat',
  'doa', 'islam', 'hadith', 'hadis', 'dzikir', 'sholawat', 'shalawat', 'tajwid',
  'yasin', 'tahlil', 'arab', 'muslim', 'ramadhan', 'ramadan', 'kitab',
]
const TECHNICAL_KW = [
  'laporan', 'report', 'data', 'analisis', 'analysis', 'keuangan', 'financial',
  'annual', 'tahunan', 'statistik', 'statistics', 'dashboard', 'proposal',
  'rencana', 'strategi', 'strategy', 'kpi', 'metrik', 'metric', 'q1', 'q2', 'q3', 'q4',
]

/** Pilih tema dari kata kunci judul (default: classic). */
export function pickTheme(title: string): CoverTheme {
  const t = title.toLowerCase()
  if (RELIGIOUS_KW.some((k) => t.includes(k))) return THEMES.religious
  if (TECHNICAL_KW.some((k) => t.includes(k))) return THEMES.technical
  return THEMES.classic
}

export function getTheme(id: ThemeId): CoverTheme {
  return THEMES[id]
}
