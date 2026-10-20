/**
 * Pembantu setup telemetri Telegram.
 *
 * Pakai:
 *   1) Buat bot via @BotFather → salin token.
 *   2) Buat file `.env` (lihat `.env.example`) berisi TELEGRAM_BOT_TOKEN=... ,
 *      lalu KIRIM satu pesan apa pun ke bot Anda di Telegram.
 *   3) Jalankan:  node scripts/telegram-setup.mjs
 *
 * Skrip akan:
 *   - menemukan chat_id Anda otomatis (via getUpdates),
 *   - mengirim pesan TES ke chat tersebut,
 *   - mencetak nilai yang harus di-set di Vercel (Environment Variables).
 *
 * Token TIDAK pernah dicetak penuh & tidak dikirim ke mana pun selain api.telegram.org.
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))

function loadEnv() {
  const env = { ...process.env }
  const file = path.join(root, '.env')
  if (existsSync(file)) {
    for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const key = line.slice(0, eq).trim()
      let val = line.slice(eq + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!(key in env) || !env[key]) env[key] = val
    }
  }
  return env
}

function mask(token) {
  if (!token) return '(kosong)'
  return token.length <= 10 ? '***' : `${token.slice(0, 6)}…${token.slice(-4)}`
}

async function api(token, method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body || {}),
  })
  return res.json()
}

async function main() {
  const env = loadEnv()
  const token = (env.TELEGRAM_BOT_TOKEN || '').trim()
  let chatId = (env.TELEGRAM_CHAT_ID || '').trim()

  if (!token) {
    console.error('✕ TELEGRAM_BOT_TOKEN belum ada. Buat `.env` (lihat .env.example) lalu isi tokennya.')
    process.exit(1)
  }
  console.log(`• Token terbaca: ${mask(token)}`)

  // Validasi token.
  const me = await api(token, 'getMe')
  if (!me.ok) {
    console.error('✕ Token ditolak Telegram:', me.description || me)
    process.exit(1)
  }
  console.log(`• Bot valid: @${me.result.username} (${me.result.first_name})`)

  // Temukan chat_id dari pesan masuk bila belum di-set.
  if (!chatId) {
    const upd = await api(token, 'getUpdates')
    if (!upd.ok) {
      console.error('✕ getUpdates gagal:', upd.description || upd)
      process.exit(1)
    }
    const chats = new Map()
    for (const u of upd.result) {
      const msg = u.message || u.channel_post || u.edited_message
      const chat = msg && msg.chat
      if (chat) chats.set(chat.id, chat)
    }
    if (chats.size === 0) {
      console.error(
        '✕ Belum ada pesan masuk. Buka Telegram, cari @' +
          me.result.username +
          ', tekan Start / kirim satu pesan, lalu jalankan skrip ini lagi.',
      )
      process.exit(1)
    }
    console.log('• Chat terdeteksi:')
    for (const chat of chats.values()) {
      const name = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username
      console.log(`    id=${chat.id}  tipe=${chat.type}  nama=${name || '-'}`)
    }
    chatId = String([...chats.keys()][0])
    console.log(`• Memakai chat_id pertama: ${chatId}`)
  } else {
    console.log(`• TELEGRAM_CHAT_ID dari .env: ${chatId}`)
  }

  // Kirim pesan tes.
  const sent = await api(token, 'sendMessage', {
    chat_id: chatId,
    text:
      '✅ <b>EPUB Builder</b> — telemetri tersambung.\nIni pesan tes. Set kedua nilai di bawah sebagai Environment Variables di Vercel.',
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  })
  if (!sent.ok) {
    console.error('✕ Gagal kirim pesan tes:', sent.description || sent)
    process.exit(1)
  }

  console.log('\n✓ Pesan tes terkirim. Cek Telegram Anda.')
  console.log('\n=== Set di Vercel → Settings → Environment Variables ===')
  console.log(`TELEGRAM_BOT_TOKEN = (token bot Anda, ${mask(token)})`)
  console.log(`TELEGRAM_CHAT_ID   = ${chatId}`)
  console.log('\nSetelah di-set, Redeploy project agar aktif.')
}

main().catch((e) => {
  console.error('GAGAL:', e)
  process.exit(1)
})
