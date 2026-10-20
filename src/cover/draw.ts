import { pickTheme, getTheme, type ThemeId, type CoverTheme } from './themes'
import { DEFAULT_COVER, fitFontSize, type CoverDimensions, type MeasureFn } from './layout'

export interface GenerateCoverOptions {
  title: string
  author?: string
  /** Paksa tema; default: deteksi dari judul. */
  theme?: ThemeId
  dimensions?: CoverDimensions
  mime?: 'image/jpeg' | 'image/png'
  quality?: number
}

/**
 * Gambar cover ke <canvas> (browser). Mengembalikan tema yang dipakai.
 * HTML5 Canvas API native — tanpa dependensi, Non-AI, instan.
 */
export function drawCoverToCanvas(
  canvas: HTMLCanvasElement,
  opts: GenerateCoverOptions,
): CoverTheme {
  const dim = opts.dimensions ?? DEFAULT_COVER
  const theme = opts.theme ? getTheme(opts.theme) : pickTheme(opts.title)
  canvas.width = dim.width
  canvas.height = dim.height
  const ctx = canvas.getContext('2d')!

  // Latar
  ctx.fillStyle = theme.background
  ctx.fillRect(0, 0, dim.width, dim.height)
  ctx.fillStyle = theme.foreground
  ctx.strokeStyle = theme.foreground

  // Ornamen
  if (theme.ornament === 'frame') {
    ctx.lineWidth = 6
    ctx.strokeRect(dim.margin * 0.5, dim.margin * 0.5, dim.width - dim.margin, dim.height - dim.margin)
    ctx.lineWidth = 2
    ctx.strokeRect(dim.margin * 0.7, dim.margin * 0.7, dim.width - dim.margin * 1.4, dim.height - dim.margin * 1.4)
  }

  const title = theme.uppercaseTitle ? opts.title.toUpperCase() : opts.title
  const innerWidth = dim.width - dim.margin * 2

  // Pengukur lebar nyata via canvas.
  const measure: MeasureFn = (text, fontSize) => {
    ctx.font = `700 ${fontSize}px ${theme.titleFont}`
    return ctx.measureText(text).width
  }

  // Ukuran font RELATIF terhadap lebar cover agar pratinjau kecil & ekspor besar
  // membungkus identik (WYSIWYG) — bukan px absolut yang bikin pratinjau sempit.
  const fit = fitFontSize(
    title,
    {
      maxWidth: innerWidth,
      maxHeight: dim.height * 0.5,
      maxFont: dim.width * 0.1125, // 180/1600
      minFont: dim.width * 0.03, // 48/1600
      lineHeightRatio: 1.2,
      maxLines: 6,
    },
    measure,
  )

  // Titik atas blok judul: idealnya terpusat di 30% tinggi, tapi diklem agar
  // tak pernah naik di atas margin (judul panjang/banyak baris tak terpotong).
  const blockTop = Math.max(dim.margin, dim.height * 0.3 - fit.blockHeight / 2)

  if (theme.ornament === 'rule') {
    ctx.lineWidth = 8
    ctx.beginPath()
    ctx.moveTo(dim.margin, blockTop - 40)
    ctx.lineTo(dim.width - dim.margin, blockTop - 40)
    ctx.stroke()
  }

  // Judul
  ctx.font = `700 ${fit.fontSize}px ${theme.titleFont}`
  ctx.textBaseline = 'middle'
  ctx.textAlign = theme.titleAlign
  const cx = theme.titleAlign === 'center' ? dim.width / 2 : dim.margin
  let y = blockTop + fit.lineHeight / 2
  for (const line of fit.lines) {
    ctx.fillText(line, cx, y)
    y += fit.lineHeight
  }

  // Author
  if (opts.author) {
    ctx.font = `400 ${Math.round(dim.width * 0.035)}px ${theme.bodyFont}`
    ctx.textAlign = 'center'
    ctx.fillText(opts.author, dim.width / 2, dim.height - dim.margin * 1.2)
  }

  return theme
}

/** Hasilkan cover sebagai Blob (JPEG/PNG) — browser. */
export async function generateCoverBlob(opts: GenerateCoverOptions): Promise<Blob> {
  const canvas = document.createElement('canvas')
  drawCoverToCanvas(canvas, opts)
  const mime = opts.mime ?? 'image/jpeg'
  const quality = opts.quality ?? 0.9
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob gagal'))), mime, quality)
  })
}
