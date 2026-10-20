import type { ContentBlock } from '@core/types'

export interface SpreadsheetOptions {
  /** Input berupa teks CSV (true) atau biner xlsx (false). */
  csv?: boolean
  /** Judul bab untuk file single-sheet (mis. nama file CSV). */
  singleSheetTitle?: string
}

/**
 * Parse .csv/.xlsx -> ContentBlock[]. Setiap sheet menjadi Heading 2 + tabel,
 * sehingga chapterize otomatis memecahnya menjadi satu bab per sheet
 * (brief Skenario B: tabel/sheet -> bab + layout CSS ramah E-Ink).
 *
 * SheetJS (xlsx, ~400 KB) di-LAZY-LOAD agar bundle awal ringan — hanya diunduh
 * saat pengguna benar-benar mengonversi berkas CSV/XLSX.
 */
export async function parseSpreadsheet(
  input: ArrayBuffer | string,
  opts: SpreadsheetOptions = {},
): Promise<ContentBlock[]> {
  const XLSX = await import('xlsx')
  const wb = opts.csv
    ? XLSX.read(input as string, { type: 'string' })
    : XLSX.read(input as ArrayBuffer, { type: 'array' })

  const out: ContentBlock[] = []
  const single = wb.SheetNames.length === 1

  wb.SheetNames.forEach((name) => {
    const ws = wb.Sheets[name]
    const aoa = XLSX.utils.sheet_to_json<string[]>(ws, {
      header: 1,
      blankrows: false,
      defval: '',
      raw: false,
    })
    if (aoa.length === 0) return

    const title = single && opts.singleSheetTitle ? opts.singleSheetTitle : name
    out.push({ kind: 'heading', level: 2, text: title })

    const header = aoa[0].map((c) => String(c ?? '').trim())
    const rows = aoa.slice(1).map((r) => r.map((c) => String(c ?? '').trim()))
    out.push({ kind: 'table', rows, header })
  })

  return out
}
