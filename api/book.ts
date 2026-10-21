/**
 * Proxy buku bergambar CC (Opsi A) — Vercel Edge Function.
 *
 * Tujuan akhir: ambil buku anak bergambar berlisensi CC dari repo publik DARI SISI
 * SERVER (melewati CORS yang memblokir fetch langsung di browser), lalu app menyusunnya
 * jadi Image-Book EPUB.
 *
 * TAHAP 1 (sekarang): `?action=probe` — uji sumber-sumber kandidat dari jaringan Vercel
 * (yang mungkin berbeda dari env dev lokal) untuk menentukan mana yang hidup & bentuk
 * datanya. Berdasar hasil, aksi `list`/`get`/`img` diimplementasikan.
 */
export const config = { runtime: 'edge' }

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  })
}

async function probeOne(label: string, url: string, opts?: RequestInit) {
  const started = Date.now()
  try {
    const r = await fetch(url, opts)
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
      url,
      status: r.status,
      contentType: ct,
      ms: Date.now() - started,
      sample: s.length > 600 ? s.slice(0, 600) + '…' : s,
    }
  } catch (e) {
    return { label, url, error: (e as Error).message, ms: Date.now() - started }
  }
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const action = url.searchParams.get('action') || 'probe'

  if (action === 'probe') {
    const results = await Promise.all([
      probeOne(
        'letsread:languages',
        'https://api.letsreadasia.org/v3/language/list?addLanguagesWithNoBook=false',
      ),
      probeOne(
        'letsread:byLanguage(id=6260074016145408)',
        'https://api.letsreadasia.org/v3/book/byLanguage?languageId=6260074016145408&limit=3',
      ),
      probeOne('gdl:languages', 'https://api.digitallibrary.io/book-api/v1/languages'),
      probeOne('gdl:books/ind', 'https://api.digitallibrary.io/book-api/v1/books/ind?page-size=3'),
      probeOne(
        'storyweaver:search',
        'https://storyweaver.org.in/api/v1/books-search?query=cat&per_page=2',
      ),
    ])
    return json({ ok: true, action, results })
  }

  return json({ ok: false, reason: 'unknown action', action }, 400)
}
