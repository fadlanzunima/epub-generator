/**
 * Inline SVG Fallback (brief): sejumlah ligatur kaligrafi Arab satu-code-point
 * (mis. Bismillah ﷽) sangat lebar/rumit dan sering "pecah" atau terpotong di
 * mesin render eReader. Membungkusnya dalam SVG inline membuatnya menjadi satu
 * elemen vektor berukuran em yang mengalir (reflowable) & tidak mengganggu
 * metrik baris. Teks SVG mewarisi font-family induk (font Naskh yang di-embed).
 *
 * Catatan EPUB: dokumen XHTML yang memuat SVG inline WAJIB menandai item
 * manifest-nya dengan properties="svg" (epubcheck). Lihat assemble.ts.
 */

/** Ligatur/kaligrafi kompleks -> {label aksesibilitas, lebar em perkiraan}. */
const COMPLEX_GLYPHS: Record<string, { label: string; emWidth: number }> = {
  '﷽': { label: 'Bismillāhir-raḥmānir-raḥīm', emWidth: 9 }, // ﷽
  'ﷺ': { label: 'ṣallallāhu ʿalayhi wa sallam', emWidth: 6 }, // ﷺ
  'ﷻ': { label: 'jalla jalāluhu', emWidth: 4 }, // ﷻ
}

const RE = new RegExp(`[${Object.keys(COMPLEX_GLYPHS).join('')}]`, 'g')

/** Apakah teks memuat glyph kaligrafi kompleks yang perlu di-SVG-kan? */
export function containsComplexGlyph(text: string): boolean {
  RE.lastIndex = 0
  return RE.test(text)
}

/** Bungkus satu glyph kompleks menjadi SVG inline berukuran em. */
function glyphToInlineSvg(ch: string): string {
  const info = COMPLEX_GLYPHS[ch]
  const w = info.emWidth
  // viewBox memakai satuan arbitrer; height 1.3em menyisakan ruang harakat.
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w * 10} 13" ` +
    `width="${w}em" height="1.3em" role="img" aria-label="${info.label}" ` +
    `style="vertical-align:-0.25em;font-family:inherit;overflow:visible">` +
    `<text x="50%" y="10.5" text-anchor="middle" font-size="12">${ch}</text>` +
    `</svg>`
  )
}

/**
 * Ganti tiap glyph kompleks pada potongan HTML/teks yang SUDAH di-escape
 * dengan SVG inline. Glyph ini bukan karakter khusus XML sehingga aman diganti
 * setelah escaping (tidak menyentuh tag inline di sekitarnya).
 */
export function wrapComplexGlyphs(escaped: string): string {
  if (!containsComplexGlyph(escaped)) return escaped
  return escaped.replace(RE, (ch) => glyphToInlineSvg(ch))
}
