import { useCallback, useMemo, useState } from 'react'
import { parseFile, parseUrl, parseHtmlArticle, parseImageOcr, parseImagesToBook } from '@parsers'
import { preflight } from '@core'
import { buildEpub, provideFonts } from '@epub'
import { generateCoverBlob } from '@cover'
import { registerCustomFont, type CustomFont } from '@fonts'
import type { ThemeId } from '@cover'
import type { DocumentIR, PreflightResult } from '@core/types'
import { pushToast } from './toast'
import { ensureNotifyPermission, notifyBuildDone } from './notify'

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
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([])
  // Font CJK on-demand (id region) — null: tidak embed (fallback font eReader).
  const [cjkFontId, setCjkFontId] = useState<string | null>(null)
  const [result, setResult] = useState<BuildResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ocrProgress, setOcrProgress] = useState<number | null>(null)
  // Pemberitahuan non-fatal hasil build (mis. font CJK gagal diunduh → fallback).
  const [buildNotices, setBuildNotices] = useState<string[]>([])

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
        let msg = (e as Error).message
        // Beri tahu bila kegagalan kemungkinan karena offline (fitur online:
        // Pustaka quran.com, fetch URL, data latih OCR).
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          msg = `Anda sedang offline — fitur ini butuh koneksi internet. (${msg})`
        }
        setError(msg)
        setStatus('error')
        pushToast(msg, 'error', 8000)
      }
    },
    [resetOutput],
  )

  const loadFile = useCallback((file: File) => runParse(() => parseFile(file), file.name), [runParse])

  /** Muat preset Pustaka (repo publik / bawaan) -> DocumentIR. */
  const loadPreset = useCallback(
    (produce: () => Promise<DocumentIR>, label: string) => runParse(produce, label),
    [runParse],
  )

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

  /** Image-Book Mode: banyak gambar -> EPUB berbasis halaman gambar grayscale. */
  const loadImages = useCallback(
    (files: File[]) =>
      runParse(() => parseImagesToBook(files), `Buku gambar: ${files.length} halaman`),
    [runParse],
  )

  /** Tambah font kustom (.ttf/.otf) untuk di-embed. */
  const addCustomFont = useCallback(async (file: File) => {
    const font = await registerCustomFont(file)
    setCustomFonts((prev) => {
      // Ganti bila family sama agar tidak dobel.
      const rest = prev.filter((f) => f.asset.id !== font.asset.id)
      return [...rest, font]
    })
    return font
  }, [])

  const removeCustomFont = useCallback((id: string) => {
    setCustomFonts((prev) => prev.filter((f) => f.asset.id !== id))
  }, [])

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
    setBuildNotices([])
    resetOutput()
    // Build berjalan asinkron (non-blocking) — pengguna boleh berpindah tab.
    // Minta izin notifikasi (gesture klik) agar bisa diberi tahu saat selesai.
    void ensureNotifyPermission()
    const needCjkDownload = ir.meta.script === 'cjk' && !!cjkFontId
    pushToast(
      needCjkDownload
        ? 'Membangun EPUB & mengunduh font CJK… boleh berpindah tab, Anda akan diberi tahu saat selesai.'
        : 'Membangun EPUB… boleh berpindah tab, Anda akan diberi tahu saat selesai.',
      'info',
      6000,
    )
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

      // Font embed (di-skip graceful bila biner belum dibundel). Font kustom
      // unggahan pengguna & CJK on-demand tetap disertakan bila dipilih
      // (meski embed otomatis off). CJK selalu di-subset (font besar).
      const wantCjk = finalIr.meta.script === 'cjk' && !!cjkFontId
      const fonts =
        embedFonts || customFonts.length > 0 || wantCjk
          ? await provideFonts(finalIr, {
              custom: customFonts,
              subset: embedFonts || wantCjk,
              cjkFontId,
            })
          : []

      // Pemberitahuan in-app bila kondisi "jujur" terjadi saat build.
      const notices: string[] = []
      if (wantCjk && !fonts.some((f) => f.asset.id === cjkFontId)) {
        notices.push(
          'Font CJK gagal diunduh (kemungkinan offline atau CDN diblokir) — EPUB memakai font CJK bawaan eReader.',
        )
      }
      setBuildNotices(notices)
      notices.forEach((n) => pushToast(n, 'warning', 8000))

      const blob = (await buildEpub(finalIr, {
        identifier: `urn:uuid:${crypto.randomUUID()}`,
        modified: nowIsoNoMs(),
        author: finalIr.meta.author,
        fonts,
        cover,
        outputType: 'blob',
      })) as Blob

      const url = URL.createObjectURL(blob)
      const fileName = toEpubFileName(cleanTitle)
      setResult({ url, fileName, bytes: blob.size, blob })
      setStatus('done')
      // Toast in-app + notifikasi sistem (muncul walau tab di-background).
      pushToast(`EPUB selesai dibuat · ${fileName}. Siap diunduh.`, 'success', 7000)
      notifyBuildDone(cleanTitle, blob.size)
    } catch (e) {
      const msg = (e as Error).message
      setError(msg)
      setStatus('error')
      pushToast(`Gagal membangun EPUB: ${msg}`, 'error', 8000)
    }
  }, [ir, title, author, coverMode, coverTheme, customCover, embedFonts, customFonts, cjkFontId, resetOutput])

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
    setCustomFonts([])
    setCjkFontId(null)
    setError(null)
    setBuildNotices([])
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
    customFonts,
    cjkFontId,
    preflightResult,
    result,
    error,
    ocrProgress,
    buildNotices,
    setTitle,
    setAuthor,
    setCoverMode,
    setCoverTheme,
    setCustomCoverFile,
    setEmbedFonts,
    setCjkFontId,
    addCustomFont,
    removeCustomFont,
    loadFile,
    loadUrl,
    loadHtml,
    loadImage,
    loadImages,
    loadPreset,
    build,
    reset,
  }
}
