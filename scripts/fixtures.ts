/**
 * Fixtures EPUB bersama untuk uji konformansi (dipakai `npm run validate` dan
 * `npm run epubcheck`). Membangun EPUB NYATA dari engine agar kedua validator
 * memeriksa artefak yang identik — satu sumber kebenaran.
 */
import { readFileSync } from 'node:fs'
import { buildEpub, type EmbeddedFont } from '@epub'
import { assembleIR, parseMarkdown } from '@parsers'
import { primaryFont, subsetWithHb, collectUsedChars, type HbSubsetExports } from '@fonts'

export interface Sample {
  /** id pendek untuk nama berkas. */
  name: string
  bytes: Uint8Array
  label: string
}

let hbCache: HbSubsetExports | null = null
async function hb(): Promise<HbSubsetExports> {
  if (!hbCache) {
    const wasm = readFileSync('node_modules/harfbuzzjs/hb-subset.wasm')
    const { instance } = await WebAssembly.instantiate(wasm)
    hbCache = instance.exports as unknown as HbSubsetExports
  }
  return hbCache
}

function embedAsset(
  h: HbSubsetExports,
  asset: NonNullable<ReturnType<typeof primaryFont>>,
  chars: Set<string>,
): EmbeddedFont {
  return {
    asset,
    binaries: asset.files.map((f) => {
      const raw = readFileSync(`public/fonts/${f.file}`)
      const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength)
      return { file: f.file, format: asset.format, data: subsetWithHb(h, buf, chars) }
    }),
  }
}

/** Bangun EPUB contoh (Latin + Arab) dengan font ter-subset nyata. */
export async function buildSampleEpubs(): Promise<Sample[]> {
  const h = await hb()

  // Latin: heading + sub-bab + list + tabel + tautan + cover + Literata (Regular+Bold).
  const latinIR = assembleIR(
    parseMarkdown(`# Panduan E-Ink
Paragraf pembuka dengan **tebal** dan *miring* serta [tautan](https://example.com).

## Bab Satu
Isi bab satu.

- a
- b

### Sub A
Teks sub.

## Bab Dua
| Nama | Umur |
|---|---|
| Budi | 20 |
`),
    { baseName: 'panduan' },
  )
  const latinFont = embedAsset(h, primaryFont('latin')!, collectUsedChars(latinIR))
  const latinFontBytes = latinFont.binaries.reduce((s, b) => s + b.data.byteLength, 0)
  const latin = (await buildEpub(latinIR, {
    identifier: 'urn:uuid:12345678-1234-5678-1234-567812345678',
    modified: '2026-10-20T00:00:00Z',
    author: 'Penulis Uji',
    fonts: [latinFont],
    cover: { data: new Uint8Array(readFileSync('public/pwa-512.png')).buffer, mime: 'image/png' },
  })) as Uint8Array

  // Arab: RTL + harakat + LPMQ Isep Misbah ter-subset.
  const arIR = assembleIR(
    parseMarkdown(`# سورة الإخلاص
قُلْ هُوَ ٱللَّهُ أَحَدٌ

## ٱللَّهُ ٱلصَّمَدُ
لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُن لَّهُۥ كُفُوًا أَحَدٌۢ`),
    { baseName: 'ikhlas' },
  )
  const arFont = embedAsset(h, primaryFont('arabic')!, collectUsedChars(arIR))
  const arab = (await buildEpub(arIR, {
    identifier: 'urn:uuid:87654321-4321-8765-4321-876543218765',
    modified: '2026-10-20T00:00:00Z',
    fonts: [arFont],
  })) as Uint8Array

  return [
    { name: 'latin', bytes: latin, label: `EPUB Latin (+cover, Literata subset ${latinFontBytes} B, tabel, sub-bab) — ${latin.byteLength} B` },
    { name: 'arab', bytes: arab, label: `EPUB Arab (RTL + LPMQ subset ${arFont.binaries[0].data.byteLength} B) — ${arab.byteLength} B` },
  ]
}
