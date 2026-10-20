/**
 * Auto-Compile dari repo publik (brief: Public Repo Integration).
 * Mengambil teks Al-Qur'an (Juz Amma) dari quran.com API v4 lalu menyusun
 * DocumentIR Arab (RTL) siap jadi EPUB ber-font Naskh. Mode Online — butuh
 * jaringan (fetch); tunduk CORS (quran.com mengizinkan CORS publik).
 */
import type { ContentBlock, DocumentIR } from '@core/types'

const API = 'https://api.quran.com/api/v4'
// Juz 30 (Juz Amma): surah 78 (An-Naba) s/d 114 (An-Nas).
const JUZ_AMMA = 30
// Terjemahan Bahasa Indonesia (Kementerian Agama RI) di quran.com.
const TRANSLATION_ID_INDONESIAN = 33

interface QuranVerse {
  verse_key: string // "78:1"
  text_uthmani?: string
  translations?: { text: string }[]
}

/** Angka Arab-Indic untuk penanda akhir ayat. */
function toArabicNumerals(n: number): string {
  const map = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
  return String(n)
    .split('')
    .map((d) => map[+d] ?? d)
    .join('')
}

/** Bersihkan tag HTML (mis. <sup foot_note=...>) dari teks terjemahan. */
function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`quran.com API HTTP ${res.status}`)
  return res.json() as Promise<T>
}

/** Peta nomor surah -> nama (latin sederhana) via daftar chapters. */
async function fetchChapterNames(): Promise<Map<number, string>> {
  const data = await getJson<{ chapters: { id: number; name_simple: string }[] }>(
    `${API}/chapters?language=id`,
  )
  const map = new Map<number, string>()
  for (const c of data.chapters) map.set(c.id, c.name_simple)
  return map
}

export interface JuzAmmaOptions {
  /** Sertakan terjemahan Bahasa Indonesia di bawah tiap ayat. */
  withTranslation?: boolean
}

/**
 * Susun DocumentIR "Juz Amma" dari quran.com: tiap surah menjadi satu bab,
 * tiap ayat satu paragraf Arab (Uthmani) + penanda nomor; opsional terjemahan.
 */
export async function fetchJuzAmmaIR(opts: JuzAmmaOptions = {}): Promise<DocumentIR> {
  const names = await fetchChapterNames()

  // Ambil seluruh ayat Juz 30 (paginasi) dalam teks Uthmani + terjemahan.
  const translations = opts.withTranslation ? `&translations=${TRANSLATION_ID_INDONESIAN}` : ''
  const verses: QuranVerse[] = []
  let pageNo = 1
  let totalPages = 1
  do {
    const data = await getJson<{ verses: QuranVerse[]; pagination: { total_pages: number } }>(
      `${API}/verses/by_juz/${JUZ_AMMA}?fields=text_uthmani${translations}&per_page=50&page=${pageNo}`,
    )
    verses.push(...data.verses)
    totalPages = data.pagination?.total_pages ?? 1
    pageNo++
  } while (pageNo <= totalPages)

  // Kelompokkan ayat per surah (dari verse_key "surah:ayat").
  const bySurah = new Map<number, QuranVerse[]>()
  for (const v of verses) {
    const surah = Number(v.verse_key.split(':')[0])
    if (!bySurah.has(surah)) bySurah.set(surah, [])
    bySurah.get(surah)!.push(v)
  }

  const chapters = [...bySurah.keys()]
    .sort((a, b) => a - b)
    .map((surah) => {
      const name = names.get(surah) ?? `Surah ${surah}`
      const blocks: ContentBlock[] = []
      for (const v of bySurah.get(surah)!) {
        const ayah = Number(v.verse_key.split(':')[1])
        if (v.text_uthmani) {
          blocks.push({ kind: 'paragraph', text: `${v.text_uthmani} ﴿${toArabicNumerals(ayah)}﴾` })
        }
        const tr = v.translations?.[0]?.text
        if (tr) blocks.push({ kind: 'paragraph', text: stripTags(tr) })
      }
      return {
        id: `surah-${surah}`,
        title: `${surah}. ${name}`,
        direction: 'rtl' as const,
        blocks,
      }
    })

  return {
    meta: {
      title: opts.withTranslation ? 'Juz Amma + Terjemahan' : 'Juz Amma',
      author: 'quran.com',
      language: 'ar',
      direction: 'rtl',
      script: 'arabic',
      source: 'quran.com API (Juz 30)',
    },
    chapters,
  }
}
