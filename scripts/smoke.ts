/**
 * Smoke test Fase 1 (Node, bukan browser).
 * Menguji jalur pure-JS: markdown, text, spreadsheet (csv & xlsx),
 * htmlToBlocks (via jsdom, simulasi output Mammoth), chapterize, buildToc, preflight.
 * Jalankan: npm run smoke
 */
import { readFileSync } from 'node:fs'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { JSDOM } from 'jsdom'
import { buildEpub, grayscaleHighContrast, buildImageBookIR } from '@epub'
import type { EmbeddedFont } from '@epub'
import { pickTheme, wrapText, fitFontSize, extractFirstImageSrc, type MeasureFn } from '@cover'
import { assembleIR, parseMarkdown, parseText, parseSpreadsheet, htmlToBlocks, articleToBlocks } from '@parsers'
import { buildToc, preflight, chapterize } from '@core'
import {
  detectLanguage,
  buildReadingCss,
  buildContentCss,
  collectUsedChars,
  buildUnicodeRange,
  subsetWithHb,
  registerCustomFont,
  fontsForScript,
  primaryFont,
  type HbSubsetExports,
} from '@fonts'

let pass = 0
let fail = 0
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    pass++
    console.log(`  ✓ ${name}`)
  } else {
    fail++
    console.error(`  ✗ ${name}`, detail ?? '')
  }
}

console.log('\n[1] Markdown parser + chapterize')
const md = `# Buku Uji
Paragraf pembuka sebelum bab.

## Bab Satu
Isi bab satu dengan **tebal** dan *miring*.

- item a
- item b

## Bab Dua
Tabel:

| Nama | Umur |
|------|------|
| Budi | 20   |
| Ani  | 22   |

### Sub Bagian
Teks sub bagian.
`
const mdBlocks = parseMarkdown(md)
const mdIR = assembleIR(mdBlocks, { baseName: 'fallback' })
check('judul diambil dari H1', mdIR.meta.title === 'Buku Uji', mdIR.meta.title)
check('intro + 2 bab = 3 bab', mdIR.chapters.length === 3, mdIR.chapters.map((c) => c.title))
check('bab intro = Pendahuluan', mdIR.chapters[0].title === 'Pendahuluan', mdIR.chapters[0].title)
check('bab 2 = "Bab Satu"', mdIR.chapters[1].title === 'Bab Satu')
check(
  'inline emphasis dipertahankan sebagai html',
  mdIR.chapters[1].blocks.some((b) => b.kind === 'paragraph' && b.html?.includes('<strong>') && b.html?.includes('<em>')),
)
check(
  'list terdeteksi',
  mdIR.chapters[1].blocks.some((b) => b.kind === 'list' && b.items.length === 2),
)
check(
  'tabel terdeteksi dengan header',
  mdIR.chapters[2].blocks.some((b) => b.kind === 'table' && b.header?.[0] === 'Nama' && b.rows.length === 2),
)

console.log('\n[2] buildToc (max 2 level)')
const toc = buildToc(mdIR.chapters)
check('toc punya 3 entri', toc.length === 3)
check(
  'bab "Bab Dua" punya 1 sub (H3)',
  toc[2].children?.length === 1 && toc[2].children[0].title === 'Sub Bagian',
  toc[2].children,
)
check('tidak ada level 3', toc.every((e) => (e.children ?? []).every((c) => !('children' in c && c.children))))

console.log('\n[3] Text parser')
const txtBlocks = parseText('Judul Singkat\n\nParagraf pertama.\n\nParagraf kedua baris satu\nbaris dua.')
check('baris pertama jadi H1', txtBlocks[0].kind === 'heading' && txtBlocks[0].level === 1)
check('2 paragraf', txtBlocks.filter((b) => b.kind === 'paragraph').length === 2)
check('soft-wrap digabung', txtBlocks.some((b) => b.kind === 'paragraph' && b.text.includes('baris satu baris dua')))

console.log('\n[4] CSV parser')
const csvBlocks = await parseSpreadsheet('Produk,Harga\nBuku,10000\nPena,2000', { csv: true, singleSheetTitle: 'Daftar Harga' })
const csvIR = assembleIR(csvBlocks, { baseName: 'daftar' })
check('judul sheet CSV = nama file', csvIR.chapters[0].title === 'Daftar Harga', csvIR.chapters[0].title)
check(
  'tabel CSV: header + 2 baris',
  csvIR.chapters[0].blocks.some((b) => b.kind === 'table' && b.header?.length === 2 && b.rows.length === 2),
)

console.log('\n[5] XLSX parser (2 sheet -> 2 bab)')
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['A', 'B'], ['1', '2']]), 'Sheet A')
XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['X'], ['9']]), 'Sheet B')
const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
const xlsxBlocks = await parseSpreadsheet(xlsxBuf)
const xlsxIR = assembleIR(xlsxBlocks, { baseName: 'data' })
check('2 sheet -> 2 bab', xlsxIR.chapters.length === 2, xlsxIR.chapters.map((c) => c.title))
check('bab = nama sheet', xlsxIR.chapters[0].title === 'Sheet A' && xlsxIR.chapters[1].title === 'Sheet B')

console.log('\n[6] htmlToBlocks (simulasi output Mammoth, via jsdom)')
const dom = new JSDOM(
  `<body><h1>Judul Docx</h1><p>Intro.</p><h2>Bagian</h2><p>Teks <strong>bold</strong> dan <span style="color:red">span dibuang</span>.</p><table><tr><th>K</th></tr><tr><td>v</td></tr></table></body>`,
)
const htmlBlocks = htmlToBlocks(dom.window.document.body)
const htmlIR = assembleIR(htmlBlocks, { baseName: 'docx' })
check('judul docx dari H1', htmlIR.meta.title === 'Judul Docx', htmlIR.meta.title)
check('style keras Word dibersihkan (span tag dibuang, teks tetap)', htmlBlocks.some((b) => b.kind === 'paragraph' && b.text?.includes('span dibuang') && !b.html?.includes('<span')))
check('strong dipertahankan', htmlBlocks.some((b) => b.kind === 'paragraph' && b.html?.includes('<strong>bold</strong>')))
check('tabel dengan th sebagai header', htmlBlocks.some((b) => b.kind === 'table' && b.header?.[0] === 'K'))

console.log('\n[7] Preflight')
const good = preflight(htmlIR)
check('IR valid lolos preflight', good.ok, good.errors)
const bad = preflight({ meta: { title: '', language: 'id', direction: 'ltr', script: 'unknown' }, chapters: [] })
check('IR rusak ditolak (judul kosong + tanpa bab)', !bad.ok && bad.errors.length >= 2, bad.errors)

console.log('\n[8] chapterize fallback (tanpa heading)')
const noHead = chapterize([{ kind: 'paragraph', text: 'Hanya satu paragraf.' }], { fallbackTitle: 'Tanpa Judul', direction: 'ltr' })
check('fallback -> 1 bab, judul = nama file', noHead.chapters.length === 1 && noHead.title === 'Tanpa Judul')

console.log('\n[9] Language Detector (Unicode-range + franc-min)')
const ar = detectLanguage('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ')
check('Arab -> script arabic', ar.script === 'arabic', ar)
check('Arab -> direction rtl', ar.direction === 'rtl')
check('Arab -> language ar', ar.language === 'ar')
const id = detectLanguage('Saya sedang membaca sebuah buku yang sangat menarik tentang sejarah nusantara dan kebudayaan Indonesia.')
check('Indonesia -> latin ltr', id.script === 'latin' && id.direction === 'ltr')
check('Indonesia -> language id', id.language === 'id', id.language)
const en = detectLanguage('This is a reasonably long english sentence written to help the statistical language detector work correctly.')
check('English -> language en', en.language === 'en', en.language)

console.log('\n[10] Integrasi detector ke assembleIR (dokumen Arab)')
const arIR = assembleIR(
  [
    { kind: 'heading', level: 1, text: 'سورة الإخلاص' },
    { kind: 'paragraph', text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ' },
  ],
  { baseName: 'ikhlas' },
)
check('meta.direction = rtl otomatis', arIR.meta.direction === 'rtl')
check('meta.script = arabic', arIR.meta.script === 'arabic')
check('meta.language = ar', arIR.meta.language === 'ar')
check('bab mewarisi arah rtl', arIR.chapters.every((c) => c.direction === 'rtl'))

console.log('\n[11] Auto-RTL CSS builder')
const arCss = buildReadingCss({ script: 'arabic', direction: 'rtl' })
// Spec EPUB: properti `direction` DILARANG di CSS (epubcheck CSS-001).
// RTL ditetapkan via atribut dir di XHTML, bukan CSS.
check('CSS Arab: TANPA properti direction (epubcheck CSS-001)', !arCss.includes('direction:'))
check('CSS Arab: line-height 2.0 (harakat)', arCss.includes('line-height: 2.0'))
check('CSS Arab: text-align right', arCss.includes('text-align: right'))
const latinCss = buildReadingCss({ script: 'latin', direction: 'ltr' })
check('CSS Latin: line-height 1.6', latinCss.includes('line-height: 1.6'))
const fullCss = buildContentCss({ script: 'arabic', direction: 'rtl' }, fontsForScript('arabic'))
check('buildContentCss menyertakan @font-face', fullCss.includes('@font-face') && fullCss.includes('KFGQPC'))

console.log('\n[12] Font registry')
check('fontsForScript(arabic) >= 3 font', fontsForScript('arabic').length >= 3)
check('primaryFont(arabic) = LPMQ Isep Misbah', primaryFont('arabic')?.id === 'lpmq-isep-misbah')
check('primaryFont(arabic) file = LPMQ-IsepMisbah.ttf', primaryFont('arabic')?.files[0].file === 'LPMQ-IsepMisbah.ttf')
check('semua font arab embeddable', fontsForScript('arabic').every((f) => f.embeddable))

console.log('\n[13] Subsetting util + Custom Font Upload')
const usedChars = collectUsedChars(arIR)
check('collectUsedChars mengumpulkan karakter', usedChars.size > 0)
const uRange = buildUnicodeRange(usedChars)
check('buildUnicodeRange -> format U+', uRange.startsWith('U+'), uRange)
const fontFile = new File([new Uint8Array([0, 1, 0, 0])], 'MyFont-Regular.ttf')
const custom = await registerCustomFont(fontFile)
check('custom font: format truetype', custom.asset.format === 'truetype')
check('custom font: family dari nama file', custom.asset.family === 'MyFont Regular', custom.asset.family)
let threw = false
try {
  await registerCustomFont(new File([new Uint8Array([0])], 'bad.pdf'))
} catch {
  threw = true
}
check('custom font: tolak ekstensi tak didukung', threw)

console.log('\n[14] EPUB Engine: build .epub (dokumen Latin)')
const epubBytes = (await buildEpub(mdIR, {
  identifier: 'urn:uuid:test-latin-0001',
  modified: '2026-10-19T00:00:00Z',
  author: 'Penulis Uji',
})) as Uint8Array
check('output Uint8Array non-kosong', epubBytes instanceof Uint8Array && epubBytes.byteLength > 0)
// OCF: mimetype WAJIB entri pertama, uncompressed.
const head = Buffer.from(epubBytes.slice(30, 58)).toString('latin1')
check('mimetype entri pertama & stored', head === 'mimetypeapplication/epub+zip', head)

const zip = await JSZip.loadAsync(epubBytes)
const names = Object.keys(zip.files)
for (const req of [
  'mimetype',
  'META-INF/container.xml',
  'OEBPS/content.opf',
  'OEBPS/nav.xhtml',
  'OEBPS/toc.ncx',
  'OEBPS/styles/content.css',
  'OEBPS/text/chap-1.xhtml',
]) {
  check(`berkas ada: ${req}`, names.includes(req))
}
check('1 berkas XHTML per bab (3 bab)', names.filter((n) => /OEBPS\/text\/chap-\d+\.xhtml/.test(n)).length === 3)

const opf = await zip.file('OEBPS/content.opf')!.async('string')
check('opf: dc:title', opf.includes('<dc:title>Buku Uji</dc:title>'))
check(`opf: dc:language (${mdIR.meta.language})`, opf.includes(`<dc:language>${mdIR.meta.language}</dc:language>`))
check('opf: dc:creator', opf.includes('Penulis Uji'))
check('opf: dcterms:modified', opf.includes('2026-10-19T00:00:00Z'))
check('opf: spine ltr', opf.includes('page-progression-direction="ltr"'))
check('opf: spine 3 itemref', (opf.match(/<itemref /g) ?? []).length === 3)

const nav = await zip.file('OEBPS/nav.xhtml')!.async('string')
check('nav: judul bab', nav.includes('Bab Satu') && nav.includes('Bab Dua'))
check('nav: sub-level H3', nav.includes('Sub Bagian') && nav.includes('.xhtml#'))

// Konsistensi anchor: href sub di nav harus ada sebagai id di berkas bab.
const subHref = nav.match(/href="(text\/chap-\d+\.xhtml#[^"]+)"/)?.[1]
check('nav punya href sub', Boolean(subHref), subHref)
if (subHref) {
  const [file, anchor] = subHref.split('#')
  const chapXml = await zip.file(`OEBPS/${file}`)!.async('string')
  check('anchor sub cocok dengan id di bab', chapXml.includes(`id="${anchor}"`))
}

console.log('\n[15] XHTML well-formed (parse sebagai application/xhtml+xml)')
let xhtmlOk = true
for (const n of names.filter((x) => x.endsWith('.xhtml'))) {
  const xml = await zip.file(n)!.async('string')
  const d = new JSDOM(xml, { contentType: 'application/xhtml+xml' })
  if (d.window.document.querySelector('parsererror')) {
    xhtmlOk = false
    console.error(`    parse error di ${n}`)
  }
}
check('semua XHTML well-formed', xhtmlOk)
const chap1 = await zip.file('OEBPS/text/chap-1.xhtml')!.async('string')
check('bab render <h1> judul', chap1.includes('<h1>'))

console.log('\n[16] EPUB Arab: RTL + embedding font')
const dummyAsset = primaryFont('arabic')!
const dummyFont: EmbeddedFont = {
  asset: dummyAsset,
  binaries: dummyAsset.files.map((f) => ({
    file: f.file,
    format: dummyAsset.format,
    data: new Uint8Array([0x4f, 0x54, 0x54, 0x4f]).buffer,
  })),
}
const arEpub = (await buildEpub(arIR, {
  identifier: 'urn:uuid:test-arab-0002',
  modified: '2026-10-19T00:00:00Z',
  fonts: [dummyFont],
})) as Uint8Array
const arZip = await JSZip.loadAsync(arEpub)
const arNames = Object.keys(arZip.files)
const arOpf = await arZip.file('OEBPS/content.opf')!.async('string')
check('opf Arab: package dir rtl', arOpf.includes('dir="rtl"'))
check('opf Arab: spine ppd rtl', arOpf.includes('page-progression-direction="rtl"'))
// LPMQ Isep Misbah = font utama (truetype) -> media-type font/ttf.
check('opf Arab: manifest font item', arOpf.includes('media-type="font/ttf"') && arOpf.includes('fonts/'))
check('biner font ter-embed di OEBPS/fonts/', arNames.some((n) => n.startsWith('OEBPS/fonts/')))
const arContentCss = await arZip.file('OEBPS/styles/content.css')!.async('string')
check('css Arab: @font-face LPMQ Isep Misbah', arContentCss.includes('@font-face') && arContentCss.includes('LPMQ Isep Misbah'))
check('css Arab: line-height 2.0 + tanpa properti direction (spec EPUB)', arContentCss.includes('line-height: 2.0') && !arContentCss.includes('direction:'))

console.log('\n[17] Cover: pemilihan tema (Topic/Category Preset Matching)')
check('judul Qur\'an -> religious', pickTheme('Juz Amma & Terjemahan').id === 'religious')
check('judul laporan -> technical', pickTheme('Laporan Keuangan Tahunan 2026').id === 'technical')
check('judul novel -> classic (default)', pickTheme('Kisah Sebuah Perjalanan').id === 'classic')

console.log('\n[18] Cover: layout adaptif (wrapText + fitFontSize)')
const measure: MeasureFn = (t, fs) => t.length * fs * 0.5
const wrapped = wrapText('Sebuah Judul Yang Cukup Panjang Untuk Dibungkus', 400, 40, measure)
check('wrapText memecah jadi beberapa baris', wrapped.length > 1)
check('tiap baris <= maxWidth', wrapped.every((l) => measure(l, 40) <= 400))
const shortFit = fitFontSize('Doa', { maxWidth: 1280, maxHeight: 1280, maxFont: 180, minFont: 48, lineHeightRatio: 1.2, maxLines: 6 }, measure)
const longFit = fitFontSize('Ensiklopedia Lengkap Sejarah Peradaban Dunia Kuno Dan Modern', { maxWidth: 1280, maxHeight: 1280, maxFont: 180, minFont: 48, lineHeightRatio: 1.2, maxLines: 6 }, measure)
check('judul pendek -> font lebih besar dari judul panjang', shortFit.fontSize > longFit.fontSize, { short: shortFit.fontSize, long: longFit.fontSize })
check('judul panjang -> multi-baris', longFit.lines.length > 1)

console.log('\n[19] Image pipeline (Grayscale High-Contrast) + Image-Book')
const px = new Uint8ClampedArray([200, 100, 50, 255, 10, 20, 30, 128])
grayscaleHighContrast(px, 80)
check('pixel jadi abu (r=g=b)', px[0] === px[1] && px[1] === px[2] && px[4] === px[5] && px[5] === px[6])
check('alpha dipertahankan', px[3] === 255 && px[7] === 128)
const ib = buildImageBookIR([{ src: 'images/p1.jpg' }, { src: 'images/p2.jpg', alt: 'Dua' }], { title: 'Komik Uji' })
check('image-book: 2 gambar -> 2 halaman', ib.chapters.length === 2)
check('tiap halaman berisi 1 blok image', ib.chapters.every((c) => c.blocks.length === 1 && c.blocks[0].kind === 'image'))
check('auto-extract gambar pertama', extractFirstImageSrc(ib) === 'images/p1.jpg')

console.log('\n[20] Integrasi cover ke EPUB (meta cover-image)')
const coverEpub = (await buildEpub(mdIR, {
  identifier: 'urn:uuid:test-cover-0003',
  modified: '2026-10-19T00:00:00Z',
  cover: { data: new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer, mime: 'image/jpeg' },
})) as Uint8Array
const coverZip = await JSZip.loadAsync(coverEpub)
check('berkas cover ada di OEBPS/images/', Object.keys(coverZip.files).includes('OEBPS/images/cover.jpg'))
const coverOpf = await coverZip.file('OEBPS/content.opf')!.async('string')
check('opf: item properties cover-image', coverOpf.includes('properties="cover-image"'))
check('opf: meta name=cover', coverOpf.includes('<meta name="cover" content="cover-image"/>'))

console.log('\n[21] Font subsetting (HarfBuzz hb-subset) — pertahankan GSUB/GPOS Arab')
const hbWasm = readFileSync('node_modules/harfbuzzjs/hb-subset.wasm')
const { instance: hbInstance } = await WebAssembly.instantiate(hbWasm)
const hbExports = hbInstance.exports as unknown as HbSubsetExports
const lpmqFile = readFileSync('public/fonts/LPMQ-IsepMisbah.ttf')
const lpmqBuf = lpmqFile.buffer.slice(lpmqFile.byteOffset, lpmqFile.byteOffset + lpmqFile.byteLength)
const quranText = 'قُلْ هُوَ ٱللَّهُ أَحَدٌ ٱللَّهُ ٱلصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ ١٢٣'
const subBuf = subsetWithHb(hbExports, lpmqBuf, new Set([...quranText]))
const subU8 = new Uint8Array(subBuf)
check('subset lebih kecil dari font asli', subBuf.byteLength < lpmqBuf.byteLength, {
  asli: lpmqBuf.byteLength,
  subset: subBuf.byteLength,
})
check('subset sfnt valid (magic 00010000)', subU8[0] === 0 && subU8[1] === 1 && subU8[2] === 0 && subU8[3] === 0)
const nTables = (subU8[4] << 8) | subU8[5]
const tags: string[] = []
for (let i = 0; i < nTables; i++) tags.push(String.fromCharCode(...subU8.slice(12 + i * 16, 12 + i * 16 + 4)))
check('subset pertahankan GSUB (shaping Arab)', tags.includes('GSUB'), tags)
check('subset pertahankan GPOS (posisi harakat)', tags.includes('GPOS'), tags)
check('subset pertahankan cmap + glyf', tags.includes('cmap') && tags.includes('glyf'))

console.log('\n[22] URL/Artikel parser (Readability) via jsdom')
const articleHtml = `<!doctype html><html><head><title>Judul Halaman</title></head><body>
  <nav>menu sampah navigasi</nav>
  <article>
    <h1>Sejarah Nusantara Singkat</h1>
    <p>Nusantara adalah istilah untuk kepulauan yang membentang luas di Asia Tenggara dan telah dihuni sejak ribuan tahun lalu oleh beragam suku bangsa.</p>
    <p>Pada masa klasik, kerajaan-kerajaan maritim seperti Sriwijaya dan Majapahit menguasai jalur perdagangan rempah yang menghubungkan banyak bangsa di dunia.</p>
    <h2>Warisan Budaya</h2>
    <p>Warisan budaya nusantara mencakup bahasa, aksara, seni pertunjukan, serta tradisi lisan yang masih bertahan hingga kini di berbagai daerah.</p>
  </article>
  <footer>hak cipta footer</footer>
</body></html>`
const artDom = new JSDOM(articleHtml, { url: 'https://contoh.test/sejarah' })
const article = articleToBlocks(artDom.window.document as unknown as Document)
check('artikel: judul terekstrak (dari <title>)', article.title.length > 0, article.title)
check('artikel: ada heading pembuka', article.blocks[0]?.kind === 'heading')
check(
  'artikel: paragraf isi terekstrak (Sriwijaya/Majapahit)',
  article.blocks.some((b) => b.kind === 'paragraph' && b.text.includes('Majapahit')),
)
check(
  'artikel: navigasi & footer dibuang (boilerplate)',
  !article.blocks.some((b) => b.kind === 'paragraph' && (b.text.includes('menu sampah') || b.text.includes('hak cipta footer'))),
)
const artIR = assembleIR(article.blocks, { baseName: article.title })
// franc-min sering memetakan teks Indonesia ke 'ms' (Melayu) — keduanya diterima.
check('artikel -> IR: bahasa id/ms terdeteksi', ['id', 'ms'].includes(artIR.meta.language), artIR.meta.language)
check('artikel -> IR: >= 2 bab (H1 + H2)', artIR.chapters.length >= 2, artIR.chapters.length)

console.log(`\n=== HASIL: ${pass} lulus, ${fail} gagal ===`)
process.exit(fail === 0 ? 0 : 1)
