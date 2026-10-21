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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  const action = (req.query?.action as string) || 'probe'

  if (action === 'probe') {
    const results = await Promise.all([
      probeOne('letsread:languages', 'https://api.letsreadasia.org/v3/language/list?addLanguagesWithNoBook=false'),
      probeOne('letsread:byLanguage', 'https://api.letsreadasia.org/v3/book/byLanguage?languageId=6260074016145408&limit=3'),
      probeOne('gdl:languages', 'https://api.digitallibrary.io/book-api/v1/languages'),
      probeOne('gdl:books/ind', 'https://api.digitallibrary.io/book-api/v1/books/ind?page-size=3'),
      probeOne('storyweaver:read.json(gated?)', 'https://storyweaver.org.in/api/v1/stories/21618-wild-cat-wild-cat/read.json'),
    ])
    res.status(200).json({ ok: true, runtime: 'node', action, results })
    return
  }

  res.status(400).json({ ok: false, reason: 'unknown action', action })
}
