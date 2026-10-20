/**
 * Endpoint telemetri (Vercel Edge Function) — meneruskan event build EPUB dari
 * aplikasi ke bot Telegram. Token bot & chat id DISIMPAN sebagai Environment
 * Variable di Vercel (RAHASIA, tidak pernah ada di kode klien):
 *   - TELEGRAM_BOT_TOKEN
 *   - TELEGRAM_CHAT_ID
 *
 * Tanpa env (mis. preview tanpa konfigurasi) → no-op 200 agar tak menimbulkan error.
 * Catatan: file di folder /api DIKOMPILASI terpisah oleh Vercel, bukan oleh
 * `tsc -b` proyek (yang hanya mencakup `src`).
 */
export const config = { runtime: 'edge' }

interface Payload {
  event?: 'attempt' | 'success' | 'fail' | string
  title?: string
  bytes?: number
  source?: string
  script?: string
  chapters?: number
  error?: string
  ua?: string
  ts?: string
}

const LABELS: Record<string, string> = {
  attempt: '⏳ Mulai membangun EPUB',
  success: '✅ EPUB berhasil dibuat',
  fail: '❌ Gagal membangun EPUB',
}

function fmtBytes(n?: number): string {
  if (typeof n !== 'number') return '-'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function esc(s: string): string {
  return s.replace(/[<&>]/g, (c) => (c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;'))
}

function ok(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  // Filter kasar anti-spam: wajib header dari klien aplikasi.
  if (req.headers.get('x-epub-report') !== '1') {
    return new Response('Forbidden', { status: 403 })
  }

  const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim()
  const chatId = (process.env.TELEGRAM_CHAT_ID || '').trim()
  if (!token || !chatId) return ok({ ok: false, reason: 'not-configured' })

  let p: Payload
  try {
    p = (await req.json()) as Payload
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const label = LABELS[String(p.event)] ?? `• ${esc(String(p.event ?? 'event'))}`
  const lines = [
    `<b>${label}</b>`,
    p.title ? `📖 ${esc(p.title)}` : null,
    p.event === 'success' ? `📦 ${fmtBytes(p.bytes)}` : null,
    p.source ? `📥 sumber: ${esc(p.source)}` : null,
    p.script ? `🔤 skrip: ${esc(p.script)}` : null,
    typeof p.chapters === 'number' ? `📑 ${p.chapters} bab` : null,
    p.error ? `⚠️ ${esc(p.error).slice(0, 300)}` : null,
    p.ts ? `🕒 ${esc(p.ts)}` : null,
    p.ua ? `🖥️ ${esc(p.ua).slice(0, 180)}` : null,
  ].filter(Boolean)

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    return ok({ ok: res.ok })
  } catch {
    return ok({ ok: false, reason: 'telegram-error' })
  }
}
