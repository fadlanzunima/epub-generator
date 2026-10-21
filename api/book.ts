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
