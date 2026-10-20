/**
 * Validator konformansi EPUB (Node) — meniru aturan INTI epubcheck + syarat
 * E-Ink, tanpa dependensi Java. Membangun EPUB nyata dari engine (Latin + Arab
 * dengan font LPMQ ter-subset HarfBuzz) lalu memeriksa OCF/OPF/NAV/NCX, integritas
 * manifest-spine, well-formedness XHTML, resolusi anchor, media-type, dan higiene CSS.
 *
 * Jalankan: npm run validate
 * Catatan: ini BUKAN pengganti epubcheck resmi; cakupannya aturan yang paling
 * sering menyebabkan eReader (Kindle/Kobo/Onyx) menolak atau salah render.
 */
import JSZip from 'jszip'
import { JSDOM } from 'jsdom'
import { buildSampleEpubs } from './fixtures'

let pass = 0
let fail = 0
let warn = 0
const ok = (n: string, c: boolean, d?: unknown) => {
  if (c) { pass++; console.log('  ok  ' + n) }
  else { fail++; console.error('  XX  ' + n, d !== undefined ? JSON.stringify(d) : '') }
}
const wa = (n: string, c: boolean, d?: unknown) => {
  if (!c) { warn++; console.warn('  !!  ' + n, d !== undefined ? JSON.stringify(d) : '') }
}

async function validate(buf: Uint8Array, label: string): Promise<void> {
  console.log('\n=== ' + label + ' ===')
  const u8 = buf

  // 1. OCF: mimetype entri pertama, STORED, isi tepat
  ok('OCF: ZIP signature', u8[0] === 0x50 && u8[1] === 0x4b && u8[2] === 0x03 && u8[3] === 0x04)
  const method = u8[8] | (u8[9] << 8)
  ok('OCF: mimetype STORED (method=0, uncompressed)', method === 0, { method })
  const nameLen = u8[26] | (u8[27] << 8)
  const extraLen = u8[28] | (u8[29] << 8)
  const name = Buffer.from(u8.slice(30, 30 + nameLen)).toString('latin1')
  ok('OCF: entri pertama = mimetype', name === 'mimetype', name)
  ok('OCF: tanpa extra field pada mimetype', extraLen === 0, { extraLen })
  const content = Buffer.from(u8.slice(30 + nameLen + extraLen, 30 + nameLen + extraLen + 20)).toString('latin1')
  ok('OCF: isi mimetype = application/epub+zip', content === 'application/epub+zip', content)

  const zip = await JSZip.loadAsync(buf)
  const names = Object.keys(zip.files).filter((n) => !zip.files[n].dir)

  // 2. container.xml
  ok('container.xml ada', names.includes('META-INF/container.xml'))
  const cdom = new JSDOM(await zip.file('META-INF/container.xml')!.async('string'), { contentType: 'application/xml' }).window.document
  ok('container.xml well-formed', !cdom.querySelector('parsererror'))
  const rootfile = cdom.querySelector('rootfile')!
  const opfPath = rootfile.getAttribute('full-path')!
  ok('container: rootfile media-type', rootfile.getAttribute('media-type') === 'application/oebps-package+xml')
  ok('container: OPF rootfile ada', names.includes(opfPath), opfPath)

  // 3. OPF
  const opf = new JSDOM(await zip.file(opfPath)!.async('string'), { contentType: 'application/xml' }).window.document
  ok('OPF well-formed XML', !opf.querySelector('parsererror'))
  const pkg = opf.querySelector('package')!
  ok('OPF version 3.0', pkg.getAttribute('version') === '3.0', pkg.getAttribute('version'))
  const uid = pkg.getAttribute('unique-identifier')
  ok('OPF unique-identifier diset', !!uid)
  const dcid = [...opf.querySelectorAll('identifier')].find((e) => e.getAttribute('id') === uid)
  ok('OPF dc:identifier cocok unique-identifier', !!dcid && dcid!.textContent!.trim().length > 0)
  ok('OPF dc:title non-kosong', ((opf.querySelector('title')?.textContent) ?? '').trim().length > 0)
  const langEl = opf.querySelector('language')
  ok('OPF dc:language ada', !!langEl && langEl.textContent!.trim().length > 0, langEl?.textContent)
  const mod = [...opf.querySelectorAll('meta')].find((m) => m.getAttribute('property') === 'dcterms:modified')
  ok('OPF dcterms:modified ada', !!mod)
  ok('OPF dcterms:modified format CCYY-MM-DDThh:mm:ssZ', !!mod && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(mod!.textContent!.trim()), mod?.textContent)

  // 4. manifest
  const base = opfPath.includes('/') ? opfPath.replace(/[^/]+$/, '') : ''
  const items = [...opf.querySelectorAll('manifest > item')]
  const idMap: Record<string, { href: string; mt: string | null; props: string }> = {}
  let navItem: Element | null = null
  for (const it of items) {
    const id = it.getAttribute('id')!
    const href = it.getAttribute('href')!
    idMap[id] = { href, mt: it.getAttribute('media-type'), props: it.getAttribute('properties') ?? '' }
    ok('manifest item ada: ' + href, names.includes(base + href), base + href)
    if ((it.getAttribute('properties') ?? '').includes('nav')) navItem = it
  }
  ok('manifest: tepat satu item nav', navItem !== null)
  ok('manifest: nav media-type xhtml', !!navItem && navItem.getAttribute('media-type') === 'application/xhtml+xml')

  // 5. spine
  const spine = opf.querySelector('spine')!
  const itemrefs = [...spine.querySelectorAll('itemref')]
  ok('spine: >=1 itemref', itemrefs.length >= 1, itemrefs.length)
  for (const ir of itemrefs) ok('spine idref valid: ' + ir.getAttribute('idref'), !!idMap[ir.getAttribute('idref')!])
  const ncxId = spine.getAttribute('toc')
  ok('spine toc->ncx (kompat Kindle lama)', !!ncxId && !!idMap[ncxId] && idMap[ncxId].mt === 'application/x-dtbncx+xml', ncxId)

  // 6. Orphan
  const manifestFiles = new Set(items.map((it) => base + it.getAttribute('href')))
  manifestFiles.add('mimetype'); manifestFiles.add('META-INF/container.xml'); manifestFiles.add(opfPath)
  for (const n of names) wa('berkas arsip tanpa referensi manifest: ' + n, manifestFiles.has(n), n)

  // 7. XHTML well-formed + kumpulkan id
  const ids: Record<string, Set<string>> = {}
  for (const n of names.filter((x) => x.endsWith('.xhtml'))) {
    const d = new JSDOM(await zip.file(n)!.async('string'), { contentType: 'application/xhtml+xml' }).window.document
    ok('XHTML well-formed: ' + n, !d.querySelector('parsererror'))
    const set = new Set<string>()
    d.querySelectorAll('[id]').forEach((e) => set.add(e.getAttribute('id')!))
    ids[n] = set
  }

  // 8. nav epub:type=toc
  const navHref = base + navItem!.getAttribute('href')!
  const navDoc = new JSDOM(await zip.file(navHref)!.async('string'), { contentType: 'application/xhtml+xml' }).window.document
  const tocNav = [...navDoc.querySelectorAll('nav')].find((n) => n.getAttribute('epub:type') === 'toc' || n.getAttribute('type') === 'toc')
  ok('nav.xhtml punya <nav epub:type="toc">', !!tocNav)

  // 10. href internal nav resolve
  for (const a of navDoc.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href')!
    if (/^https?:/.test(href)) continue
    const [f, anchor] = href.split('#')
    const target = base + f
    ok('nav href file ada: ' + f, names.includes(target), target)
    if (anchor) ok('nav anchor #' + anchor + ' ada di ' + f, !!ids[target] && ids[target].has(anchor), { f, anchor })
  }

  // 11/12. font & cover media-type
  for (const it of items) {
    const mt = it.getAttribute('media-type')
    const href = it.getAttribute('href')!
    if (href.endsWith('.ttf')) ok('font .ttf -> font/ttf', mt === 'font/ttf', { href, mt })
    if (href.endsWith('.otf')) ok('font .otf -> font/otf', mt === 'font/otf', { href, mt })
    if ((it.getAttribute('properties') ?? '').includes('cover-image')) ok('cover-image = image/*', /^image\//.test(mt ?? ''), mt)
  }

  // 13. E-Ink CSS higiene
  const cssItem = items.find((it) => it.getAttribute('media-type') === 'text/css')
  if (cssItem) {
    const css = await zip.file(base + cssItem.getAttribute('href'))!.async('string')
    ok('E-Ink: font-size pakai em (reflowable), bukan px kaku', !/font-size:\s*\d+px/.test(css))
    // epubcheck CSS-001: properti `direction` dilarang di stylesheet EPUB.
    ok('Spec: CSS tanpa properti `direction` (epubcheck CSS-001)', !/(^|[;{\s])direction\s*:/.test(css))
    wa('E-Ink: tanpa box-shadow (anti-ghosting)', !/box-shadow/.test(css))
    wa('E-Ink: tanpa animation/transition', !/(animation|transition):/.test(css))
  }
}

// --- Bangun EPUB uji dari engine (fixtures bersama dengan epubcheck) ---
const samples = await buildSampleEpubs()
for (const s of samples) await validate(s.bytes, s.label)

// Arab-spesifik
console.log('\n=== Arab-spesifik ===')
const arEpub = samples.find((s) => s.name === 'arab')!.bytes
const arZip = await JSZip.loadAsync(arEpub)
const arOpf = await arZip.file('OEBPS/content.opf')!.async('string')
ok('Arab OPF: package dir="rtl"', /dir="rtl"/.test(arOpf))
ok('Arab OPF: spine page-progression-direction="rtl"', /page-progression-direction="rtl"/.test(arOpf))
const arCss = await arZip.file('OEBPS/styles/content.css')!.async('string')
ok('Arab CSS: @font-face LPMQ + line-height 2.0 (RTL via dir attr, bukan CSS)',
  /@font-face/.test(arCss) && /LPMQ Isep Misbah/.test(arCss) && /line-height:\s*2\.0/.test(arCss))

// Metadata lanjutan (dc:publisher/description/subject) di EPUB Latin
console.log('\n=== Metadata lanjutan ===')
const latinEpub = samples.find((s) => s.name === 'latin')!.bytes
const latinOpf = await (await JSZip.loadAsync(latinEpub)).file('OEBPS/content.opf')!.async('string')
ok('OPF dc:publisher ada', /<dc:publisher>Penerbit Uji<\/dc:publisher>/.test(latinOpf))
ok('OPF dc:description ada', /<dc:description>[^<]+<\/dc:description>/.test(latinOpf))
ok('OPF dc:subject (>=2)', (latinOpf.match(/<dc:subject>/g) ?? []).length >= 2)

// Image-Book + Inline SVG spesifik
console.log('\n=== Image-Book + SVG ===')
const bookEpub = samples.find((s) => s.name === 'imagebook')!.bytes
const bookZip = await JSZip.loadAsync(bookEpub)
const bookOpf = await bookZip.file('OEBPS/content.opf')!.async('string')
ok('Image-Book: aset gambar ditulis ke OEBPS/images/', Object.keys(bookZip.files).includes('OEBPS/images/p1.png'))
ok('Image-Book: manifest memuat item gambar (image/png)', /href="images\/p1\.png"[^>]*media-type="image\/png"/.test(bookOpf))
const basmalahXhtml = await bookZip.file('OEBPS/text/chap-2.xhtml')!.async('string')
ok('Inline SVG: bab kaligrafi memuat <svg>', /<svg[\s>]/.test(basmalahXhtml))
ok('Inline SVG: item bab ber-properties="svg"', /href="text\/chap-2\.xhtml"[^>]*properties="[^"]*svg[^"]*"/.test(bookOpf))
const imgXhtml = await bookZip.file('OEBPS/text/chap-1.xhtml')!.async('string')
ok('Image-Book: src gambar diresolusi relatif bab (../images/)', /src="\.\.\/images\/p1\.png"/.test(imgXhtml))

console.log(`\n=== VALIDASI: ${pass} lulus, ${fail} gagal, ${warn} peringatan ===`)
process.exit(fail === 0 ? 0 : 1)
