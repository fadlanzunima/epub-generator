import type { DocumentIR, ScriptHint } from '@core/types'
import { collectUsedChars, subsetFont } from '@fonts/subset'
import { FONT_REGISTRY, fontsForScript, primaryFont } from '@fonts/fonts'
import type { FontAsset } from '@fonts/fonts'
import type { CustomFont } from '@fonts/customFont'
import type { EmbeddedFont, FontBinary } from './types'

const FORMAT_EXT: Record<'truetype' | 'opentype', string> = { truetype: 'ttf', opentype: 'otf' }

export interface ProvideFontsOptions {
  /** Base URL biner font bundled (public/fonts/). Default '/fonts/'. */
  baseUrl?: string
  custom?: CustomFont[]
  /** Terapkan subsetting (default true). */
  subset?: boolean
  /**
   * Untuk skrip CJK: id font region yang dipilih (noto-sans-sc|jp|kr) untuk
   * diunduh on-demand dari CDN & disematkan. null/undefined = tidak embed CJK
   * (jatuh ke font bawaan eReader).
   */
  cjkFontId?: string | null
}

/**
 * Sediakan font yang akan di-embed untuk sebuah dokumen (browser-only, pakai fetch).
 *  - Ambil biner font bundled yang cocok dengan skrip dokumen dari public/fonts/.
 *  - Sertakan font kustom unggahan pengguna.
 *  - Terapkan subsetFont (hemat ukuran) berdasarkan karakter yang dipakai.
 *
 * Font yang binernya tidak tersedia (belum dibundel) dilewati dengan peringatan,
 * agar EPUB tetap terbentuk (jatuh ke font cadangan eReader).
 */
export async function provideFonts(ir: DocumentIR, opts: ProvideFontsOptions = {}): Promise<EmbeddedFont[]> {
  const base = opts.baseUrl ?? '/fonts/'
  const chars = collectUsedChars(ir)
  const doSubset = opts.subset ?? true
  const result: EmbeddedFont[] = []

  // Resource Lean: embed hanya font UTAMA skrip (bukan semua kandidat), agar
  // EPUB tetap ringan. Font lain tetap tercantum di CSS sebagai cadangan eReader.
  const script = ir.meta.script as ScriptHint
  let assets: FontAsset[]
  if (script === 'cjk') {
    // CJK tak dibundel: hanya embed bila pengguna memilih region (diunduh remote).
    const chosen = opts.cjkFontId ? FONT_REGISTRY.find((f) => f.id === opts.cjkFontId) : undefined
    assets = chosen ? [chosen] : []
  } else {
    const primary = primaryFont(script)
    assets = primary ? [primary] : fontsForScript(script)
  }

  for (const asset of assets) {
    const binaries: FontBinary[] = []
    for (const f of asset.files) {
      try {
        // Biner lokal (public/fonts/) dulu; bila tak ada & font punya remoteUrl
        // (mis. CJK), unduh dari CDN on-demand lalu subset agar embed tetap kecil.
        const local = await fetch(`${base}${f.file}`).catch(() => null)
        let data: ArrayBuffer
        if (local && local.ok) {
          data = await local.arrayBuffer()
        } else if (asset.remoteUrl) {
          const remote = await fetch(asset.remoteUrl)
          if (!remote.ok) throw new Error(`remote HTTP ${remote.status}`)
          data = await remote.arrayBuffer()
        } else {
          throw new Error(`HTTP ${local?.status ?? 'gagal'}`)
        }
        if (doSubset) data = await subsetFont({ fontData: data, chars })
        binaries.push({ file: f.file, format: asset.format, data })
      } catch (e) {
        console.warn(`[fontProvider] lewati ${f.file}: ${(e as Error).message}`)
      }
    }
    if (binaries.length) result.push({ asset, binaries })
  }

  // Font kustom unggahan pengguna
  for (const cf of opts.custom ?? []) {
    const bin = cf.asset.files[0]
    let data = cf.data
    if (doSubset) data = await subsetFont({ fontData: data, chars })
    result.push({
      asset: cf.asset,
      binaries: [{ file: bin.file, format: cf.asset.format, data }],
    })
  }

  return result
}

/** Util: pastikan nama berkas font punya ekstensi sesuai format. */
export function fontFileName(family: string, format: 'truetype' | 'opentype'): string {
  return `${family.replace(/\s+/g, '')}.${FORMAT_EXT[format]}`
}
