/**
 * Proxy buku bergambar CC (Opsi A) — Vercel Serverless (Node runtime).
 *
 * Node runtime (bukan Edge) agar fetch ke host eksternal tidak dibatasi seperti di
 * Edge. TAHAP 1: `?action=probe` menguji sumber CC dari jaringan Vercel untuk memilih
 * sumber yang hidup + bentuk datanya, sebelum aksi list/get/img diimplementasikan.
 */
const UA = 'epub-builder/1.0 (+https://epub-generator-phi.vercel.app)'

async function probeOne(label: string, url: string) {
  const started = Date.now()
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    const ct = r.headers.get('content-type') || ''
    let sample: unknown = null
    try {
      sample = ct.includes('json') ? await r.json() : (await r.text()).slice(0, 200)
    } catch {
      sample = '(gagal baca body)'
    }
    const s = JSON.stringify(sample)
    return {
      label,
      status: r.status,
      contentType: ct,
      ms: Date.now() - started,
      sample: s.length > 500 ? s.slice(0, 500) + '…' : s,
    }
  } catch (e) {
    return { label, error: `${(e as Error).name}: ${(e as Error).message}`, ms: Date.now() - started }
  }
}

async function discoverLetsRead() {
  const out: Record<string, unknown> = {}
  try {
    const r = await fetch('https://reader.letsreadasia.org/', { headers: { 'User-Agent': UA } })
    const html = await r.text()
    out.htmlStatus = r.status
    // kumpulkan src script & href yang menunjuk host/api
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]).slice(0, 10)
    out.scripts = scripts
    // cari string host api di HTML
    const hosts = [...new Set((html.match(/https?:\/\/[a-z0-9.-]*letsreadasia[a-z0-9.\-/]*/gi) || []))].slice(0, 15)
    out.letsreadHosts = hosts
    // ambil satu bundle JS & cari base API
    const js = scripts.find((s) => /main|app|chunk|bundle/.test(s))
    if (js) {
      const jsUrl = js.startsWith('http') ? js : `https://reader.letsreadasia.org${js}`
      const jr = await fetch(jsUrl, { headers: { 'User-Agent': UA } })
      const jt = await jr.text()
      const apis = [...new Set((jt.match(/https?:\/\/[a-z0-9.-]+\.(?:org|io|com|app)[a-z0-9.\-/_]*(?:api|book|graphql)[a-z0-9.\-/_]*/gi) || []))].slice(0, 20)
      out.jsApiHints = apis
      out.jsLen = jt.length
    }
  } catch (e) {
    out.error = `${(e as Error).name}: ${(e as Error).message}`
  }
  return out
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const action = (req.query?.action as string) || 'probe'

  if (action === 'discover') {
    res.status(200).json({ ok: true, letsread: await discoverLetsRead() })
    return
  }

  if (action === 'probe') {
    const sw = '21618-wild-cat-wild-cat'
    const results = await Promise.all([
      // StoryWeaver: endpoint unduh PDF/epub (mungkin publik, tak gated seperti reader)
      probeOne('sw:pdf-download', `https://storyweaver.org.in/api/v1/books/${sw}/download?type=pdf`),
      probeOne('sw:epub-download', `https://storyweaver.org.in/api/v1/books/${sw}/download?type=epub`),
      probeOne('sw:v0 download', `https://storyweaver.org.in/v0/stories/download-story/${sw}.pdf`),
      probeOne('sw:gcs-image', 'https://storage.googleapis.com/static.storyweaver.org.in/illustration_crops/722383/size7/b67b65b0b4e07eecc3cd0aa184e1548c.jpg'),
      // GDL host alternatif
      probeOne('gdl:root', 'https://api.digitallibrary.io/'),
      probeOne('gdl:opds', 'https://api.digitallibrary.io/book-api/opds/v1/root.xml'),
      // Let's Read host alternatif
      probeOne('letsread:www', 'https://www.letsreadasia.org/'),
      probeOne('letsread:reader', 'https://reader.letsreadasia.org/'),
    ])
    res.status(200).json({ ok: true, runtime: 'node', action, results })
    return
  }

  res.status(400).json({ ok: false, reason: 'unknown action', action })
}
