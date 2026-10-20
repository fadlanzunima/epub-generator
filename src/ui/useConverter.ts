import { useCallback, useMemo, useState } from 'react'
import { parseFile, parseUrl, parseHtmlArticle, parseImageOcr } from '@parsers'
import { preflight } from '@core'
import { buildEpub, provideFonts } from '@epub'
import { generateCoverBlob } from '@cover'
import type { ThemeId } from '@cover'
import type { DocumentIR, PreflightResult } from '@core/types'

/** Status mesin konversi (state machine linear). */
export type ConvertStatus = 'idle' | 'parsing' | 'ready' | 'building' | 'done' | 'error'

/** Sumber sampul yang dipilih pengguna. */
export type CoverMode = 'none' | 'auto' | 'custom'

export interface CustomCover {
  data: ArrayBuffer
  mime: string
  /** Object URL untuk pratinjau; direvoke saat diganti. */
  previewUrl: string
  fileName: string
}

export interface BuildResult {
  url: string
  fileName: string
  bytes: number
  /** Blob mentah EPUB — dipakai Web Share (transfer ke perangkat lain). */
  blob: Blob
}

/** Slug nama berkas .epub dari judul. */
function toEpubFileName(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
  return `${slug || 'buku'}.epub`
}

/** ISO tanpa milidetik untuk dcterms:modified. */
function nowIsoNoMs(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
}

/**
 * Hook orkestrasi end-to-end: File -> DocumentIR -> (edit meta/cover) -> .epub.
 * Seluruh proses berjalan di RAM browser; tidak ada panggilan jaringan selain
 * fetch biner font bundled (public/fonts/) yang di-skip bila belum tersedia.
 */
export function useConverter() {
  const [status, setStatus] = useState<ConvertStatus>('idle')
  const [ir, setIr] = useState<DocumentIR | null>(null)
  const [sourceName, setSourceName] = useState<string>('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [coverMode, setCoverMode] = useState<CoverMode>('auto')
  const [coverTheme, setCoverTheme] = useState<ThemeId | undefined>(undefined)
  const [customCover, setCustomCover] = useState<CustomCover | null>(null)
  const [embedFonts, setEmbedFonts] = useState(true)
  const [result, setResult] = useState<BuildResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState<number | null>(null)

  const preflightResult: PreflightResult | null = useMemo(() => {
    if (!ir) return null
    // Pakai judul hasil edit untuk validasi real-time.
    return preflight({ ...ir, meta: { ...ir.meta, title: title.trim() } })
  }, [ir, title])

  /** Bersihkan hasil build & cover kustom lama (revoke object URL). */
  const resetOutput = useCallback(() => {
    setResult((prev) => {
      if (prev) URL.revokeObjectURL(prev.url)
      return null
    })
  }, [])

  /** Jalur umum: parse sumber apa pun -> DocumentIR, kelola status & error. */
  const runParse = useCallback(
    async (produce: () => Promise<DocumentIR>, source: string) => {
      setStatus('parsing')
      setError(null)
      setOcrProgress(null)
      resetOutput()
      try {
        const parsed = await produce()
        setIr(parsed)
        setSourceName(source)
        setTitle(parsed.meta.title)
        setAuthor(parsed.meta.author ?? '')
        setStatus('ready')
      } catch (e) {
        setError((e as Error).message)
        setStatus('error')
      }
    },
    [resetOutput],
  )

  const loadFile = useCallback((file: File) => runParse(() => parseFile(file), file.name), [runParse])

  const loadUrl = useCallback((url: string) => runParse(() => parseUrl(url), url), [runParse])

  const loadHtml = useCallback(
    (html: string) => runParse(async () => parseHtmlArticle(html), 'artikel ditempel'),
    [runParse],
  )

  const loadImage = useCallback(
    (file: File, lang: string) =>
      runParse(
        () => parseImageOcr(file, { lang, baseName: file.name.replace(/\.[^.]+$/, ''), onProgress: setOcrProgress }),
        `OCR: ${file.name}`,
      ),
    [runParse],
  )

  const setCustomCoverFile = useCallback(async (file: File) => {
    const data = await file.arrayBuffer()
    setCustomCover((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return {
        data,
        mime: file.type || 'image/jpeg',
        previewUrl: URL.createObjectURL(file),
        fileName: file.name,
      }
    })
    setCoverMode('custom')
  }, [])

  const build = useCallback(async () => {
    if (!ir) return
    const cleanTitle = title.trim()
    const check = preflight({ ...ir, meta: { ...ir.meta, title: cleanTitle } })
    if (!check.ok) {
      setError(check.errors.join(' '))
      setStatus('error')
      return
    }

    setStatus('building')
    setError(null)
    resetOutput()
    try {
      const finalIr: DocumentIR = {
        ...ir,
        meta: { ...ir.meta, title: cleanTitle, author: author.trim() || undefined },
      }

      // Sampul
      let cover: { data: ArrayBuffer; mime: string } | undefined
      if (coverMode === 'auto') {
        const blob = await generateCoverBlob({
          title: cleanTitle,
          author: author.trim() || undefined,
          theme: coverTheme,
        })
        cover = { data: await blob.arrayBuffer(), mime: blob.type || 'image/jpeg' }
      } else if (coverMode === 'custom' && customCover) {
        cover = { data: customCover.data, mime: customCover.mime }
      }

      // Font embed (di-skip graceful bila biner belum dibundel)
      const fonts = embedFonts ? await provideFonts(finalIr) : []

      const blob = (await buildEpub(finalIr, {
        identifier: `urn:uuid:${crypto.randomUUID()}`,
        modified: nowIsoNoMs(),
        author: finalIr.meta.author,
        fonts,
        cover,
        outputType: 'blob',
      })) as Blob

      const url = URL.createObjectURL(blob)
      setResult({ url, fileName: toEpubFileName(cleanTitle), bytes: blob.size, blob })
      setStatus('done')
    } catch (e) {
      setError((e as Error).message)
      setStatus('error')
    }
  }, [ir, title, author, coverMode, coverTheme, customCover, embedFonts, resetOutput])

  const reset = useCallback(() => {
    resetOutput()
    setCustomCover((prev) => {
      if (prev) URL.revokeObjectURL(prev.previewUrl)
      return null
    })
    setIr(null)
    setSourceName('')
    setTitle('')
    setAuthor('')
    setCoverMode('auto')
    setCoverTheme(undefined)
    setError(null)
    setOcrProgress(null)
    setStatus('idle')
  }, [resetOutput])

  return {
    status,
    ir,
    sourceName,
    title,
    author,
    coverMode,
    coverTheme,
    customCover,
    embedFonts,
    preflightResult,
    result,
    error,
    ocrProgress,
    setTitle,
    setAuthor,
    setCoverMode,
    setCoverTheme,
    setCustomCoverFile,
    setEmbedFonts,
    loadFile,
    loadUrl,
    loadHtml,
    loadImage,
    build,
    reset,
  }
}
