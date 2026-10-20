import { franc } from 'franc-min'
import type { ScriptHint, TextDirection } from '@core/types'

export interface DetectionResult {
  script: ScriptHint
  direction: TextDirection
  /** Kode BCP-47 untuk <dc:language>. */
  language: string
  /** 0..1 — proporsi karakter skrip dominan terhadap total karakter berarti. */
  confidence: number
}

/** Blok Unicode -> ScriptHint. Urutan penting: diperiksa per code point. */
interface Range {
  script: Exclude<ScriptHint, 'unknown'>
  rtl: boolean
  from: number
  to: number
}

const RANGES: Range[] = [
  // Arab (termasuk presentation forms) — RTL
  { script: 'arabic', rtl: true, from: 0x0600, to: 0x06ff },
  { script: 'arabic', rtl: true, from: 0x0750, to: 0x077f },
  { script: 'arabic', rtl: true, from: 0x08a0, to: 0x08ff },
  { script: 'arabic', rtl: true, from: 0xfb50, to: 0xfdff },
  { script: 'arabic', rtl: true, from: 0xfe70, to: 0xfeff },
  // CJK: Han, Hiragana/Katakana, Hangul
  { script: 'cjk', rtl: false, from: 0x4e00, to: 0x9fff },
  { script: 'cjk', rtl: false, from: 0x3400, to: 0x4dbf },
  { script: 'cjk', rtl: false, from: 0x3040, to: 0x30ff },
  { script: 'cjk', rtl: false, from: 0xac00, to: 0xd7af },
  // Cyrillic
  { script: 'cyrillic', rtl: false, from: 0x0400, to: 0x04ff },
  // Aksara Nusantara
  { script: 'javanese', rtl: false, from: 0xa980, to: 0xa9df },
  { script: 'sundanese', rtl: false, from: 0x1b80, to: 0x1bbf },
  // Latin dasar + extended
  { script: 'latin', rtl: false, from: 0x0041, to: 0x024f },
]

// Peta ISO 639-3 (franc) -> BCP-47 untuk skrip Latin/CJK/Cyrillic.
const ISO_MAP: Record<string, string> = {
  ind: 'id',
  zlm: 'ms',
  msa: 'ms',
  eng: 'en',
  arb: 'ar',
  ara: 'ar',
  cmn: 'zh',
  jpn: 'ja',
  kor: 'ko',
  rus: 'ru',
  ukr: 'uk',
  jav: 'jv',
  sun: 'su',
  spa: 'es',
  fra: 'fr',
  deu: 'de',
  nld: 'nl',
}

const DEFAULT_LANG: Record<ScriptHint, string> = {
  arabic: 'ar',
  cjk: 'zh',
  cyrillic: 'ru',
  javanese: 'jv',
  sundanese: 'su',
  latin: 'id',
  unknown: 'id',
}

function scriptOf(cp: number): { script: ScriptHint; rtl: boolean } | null {
  for (const r of RANGES) {
    if (cp >= r.from && cp <= r.to) return { script: r.script, rtl: r.rtl }
  }
  return null
}

/**
 * Deteksi skrip & bahasa tanpa AI:
 *  1. Hitung code point per blok Unicode -> tentukan skrip dominan + arah baca.
 *  2. Untuk skrip Latin/CJK/Cyrillic, perhalus bahasa via franc-min (statistik n-gram).
 *  3. Skrip Arab langsung dc:language='ar' + dir='rtl'.
 */
export function detectLanguage(text: string): DetectionResult {
  const counts: Record<string, number> = {}
  let meaningful = 0
  let rtlCount = 0

  for (const ch of text) {
    const cp = ch.codePointAt(0)!
    const hit = scriptOf(cp)
    if (!hit) continue // whitespace, angka, tanda baca: diabaikan
    counts[hit.script] = (counts[hit.script] ?? 0) + 1
    meaningful++
    if (hit.rtl) rtlCount++
  }

  if (meaningful === 0) {
    return { script: 'unknown', direction: 'ltr', language: 'id', confidence: 0 }
  }

  // Skrip dominan (termasuk latin).
  let script: ScriptHint = 'unknown'
  let max = 0
  for (const [s, n] of Object.entries(counts)) {
    if (n > max) {
      max = n
      script = s as ScriptHint
    }
  }

  const direction: TextDirection = rtlCount / meaningful > 0.3 ? 'rtl' : 'ltr'
  const confidence = max / meaningful

  let language: string
  if (script === 'arabic') {
    language = 'ar'
  } else {
    const iso = franc(text, { minLength: 10 })
    language = iso !== 'und' && ISO_MAP[iso] ? ISO_MAP[iso] : DEFAULT_LANG[script]
  }

  return { script, direction, language, confidence }
}
