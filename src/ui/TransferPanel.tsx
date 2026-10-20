/**
 * Panel transfer hasil (Fase 6): unduh, bagikan berkas via Web Share
 * (Send-to-Kindle/email/AirDrop), dan QR untuk membuka aplikasi di perangkat lain.
 */
import { useEffect, useState } from 'react'
import {
  appUrlQrDataUrl,
  canShareFile,
  epubBlobToFile,
  kindleMailto,
  KINDLE_UPLOAD_URL,
  shareEpub,
} from '@pwa'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(2)} MB`
}

export function TransferPanel({
  blob,
  url,
  fileName,
  bytes,
  title,
  onReset,
}: {
  blob: Blob
  url: string
  fileName: string
  bytes: number
  title: string
  onReset: () => void
}) {
  const file = epubBlobToFile(blob, fileName)
  const shareable = canShareFile(file)
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [showKindle, setShowKindle] = useState(false)
  const [kindleEmail, setKindleEmail] = useState('')

  useEffect(() => {
    if (showQr && !qr) appUrlQrDataUrl().then(setQr).catch(() => setShareMsg('QR gagal dibuat.'))
  }, [showQr, qr])

  async function onShare() {
    setShareMsg(null)
    const res = await shareEpub(file, title).catch(() => 'error' as const)
    if (res === 'unsupported') setShareMsg('Berbagi berkas tidak didukung di peramban ini — gunakan Unduh.')
    else if (res === 'error') setShareMsg('Gagal berbagi.')
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-ui text-body-lg text-ink">EPUB siap · {formatBytes(bytes)}</p>

      <a href={url} download={fileName} className="btn-eink btn-eink--inverted no-underline">
        Unduh {fileName}
      </a>

      {shareable && (
        <button type="button" className="btn-eink" onClick={onShare}>
          Bagikan / Kirim ke Perangkat
        </button>
      )}

      <button type="button" className="btn-eink" onClick={() => setShowKindle((v) => !v)}>
        {showKindle ? 'Tutup Kirim ke Kindle' : 'Kirim ke Kindle'}
      </button>

      {showKindle && (
        <div className="flex flex-col gap-3 border-eink border-black bg-white p-4">
          <p className="font-ui text-body text-ink-muted">
            EPUB 3.0 ini valid dan otomatis dikonversi Amazon ke format Kindle (KFX). Dua cara:
          </p>
          <ol className="flex list-decimal flex-col gap-1 pl-5 font-ui text-body text-ink">
            <li>
              <strong>Unggah web:</strong> unduh berkas di atas, lalu buka halaman resmi Amazon dan
              seret-lepas berkasnya.
              <a
                href={KINDLE_UPLOAD_URL}
                target="_blank"
                rel="noreferrer"
                className="ml-1 underline"
              >
                Buka Send-to-Kindle ↗
              </a>
            </li>
            <li>
              <strong>Email:</strong> kirim berkas sebagai lampiran ke alamat <code>@kindle.com</code> Anda.
            </li>
          </ol>
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-body text-ink-muted">Alamat Kindle Anda (opsional)</span>
            <input
              type="email"
              inputMode="email"
              value={kindleEmail}
              placeholder="nama_123@kindle.com"
              onChange={(e) => setKindleEmail(e.target.value)}
              className="min-h-tap border-eink border-black bg-white px-3 font-ui text-body-lg text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:border-dashed"
            />
          </label>
          <a
            href={kindleEmail.trim() ? kindleMailto(kindleEmail.trim(), title, fileName) : undefined}
            className={`btn-eink no-underline ${kindleEmail.trim() ? '' : 'pointer-events-none opacity-50'}`}
            aria-disabled={!kindleEmail.trim()}
          >
            Siapkan Email ke Kindle
          </a>
          <p className="font-ui text-body text-ink-faint">
            Catatan: peramban tidak dapat melampirkan berkas otomatis — lampirkan{' '}
            <strong>{fileName}</strong> yang sudah diunduh secara manual.
          </p>
        </div>
      )}

      <button type="button" className="btn-eink" onClick={() => setShowQr((v) => !v)}>
        {showQr ? 'Sembunyikan QR' : 'Buka di Perangkat Lain (QR)'}
      </button>

      {showQr && (
        <div className="flex flex-col items-center gap-2 border-eink border-black bg-white p-4">
          {qr ? (
            <img src={qr} alt="QR kode untuk membuka aplikasi" width={180} height={180} />
          ) : (
            <span className="font-ui text-body text-ink-faint">Membuat QR…</span>
          )}
          <span className="max-w-xs text-center font-ui text-body text-ink-muted">
            Pindai untuk membuka aplikasi di ponsel / e-reader, lalu bangun atau unduh EPUB di sana.
          </span>
        </div>
      )}

      {shareMsg && <p className="font-ui text-body text-ink-muted">{shareMsg}</p>}

      <button type="button" className="btn-eink" onClick={onReset}>
        Konversi Dokumen Lain
      </button>
    </div>
  )
}
