import type { FontAsset } from './fonts'

export interface CustomFont {
  asset: FontAsset
  /** Biner font untuk di-embed ke OEBPS/fonts/ (brief: Custom Font Upload). */
  data: ArrayBuffer
}

const EXT_FORMAT: Record<string, FontAsset['format']> = {
  ttf: 'truetype',
  otf: 'opentype',
}

/** Turunkan nama family dari nama file (mis. "MyFont-Regular.ttf" -> "MyFont Regular"). */
function familyFromName(filename: string): string {
  return (
    filename
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Custom Font'
  )
}

/**
 * Validasi & baca file font (.ttf/.otf) yang diunggah pengguna menjadi CustomFont
 * siap embed. 100% client-side (FileReader/arrayBuffer), tanpa server.
 */
export async function registerCustomFont(file: File): Promise<CustomFont> {
  const ext = file.name.toLowerCase().split('.').pop() ?? ''
  const format = EXT_FORMAT[ext]
  if (!format) {
    throw new Error(`Format font tidak didukung: .${ext} (hanya .ttf / .otf)`)
  }

  const data = await file.arrayBuffer()
  const family = familyFromName(file.name)
  const outFile = `${family.replace(/\s+/g, '')}.${ext}`

  const asset: FontAsset = {
    id: `custom-${family.toLowerCase().replace(/\s+/g, '-')}`,
    family,
    files: [{ style: 'normal', weight: 400, file: outFile }],
    format,
    scripts: ['unknown'], // font kustom bisa untuk skrip apa pun
    embeddable: true,
    source: { license: 'User-provided', url: '' },
  }

  return { asset, data }
}
