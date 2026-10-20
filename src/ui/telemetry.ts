/**
 * Telemetri build (opsional) — mengirim ringkasan event pembuatan EPUB ke
 * endpoint /api/report (Vercel Edge), lalu diteruskan ke Telegram pemilik.
 * Fire-and-forget: tidak pernah melempar error & tidak memblokir alur build.
 *
 * CATATAN PRIVASI: ini MENGIRIM metadata (judul, ukuran, sumber, skrip, jumlah
 * bab, user-agent) ke server pemilik aplikasi — jadi app tidak lagi 100% tanpa
 * kirim data saat di-deploy dengan telemetri aktif. ISI dokumen tidak dikirim.
 * Nonaktif otomatis bila endpoint belum dikonfigurasi (balas not-configured).
 */
const ENDPOINT = '/api/report'

export type TelemetryEvent = 'attempt' | 'success' | 'fail'

export interface ReportPayload {
  event: TelemetryEvent
  title?: string
  bytes?: number
  source?: string
  script?: string
  chapters?: number
  error?: string
}

export function reportEvent(payload: ReportPayload): void {
  try {
    const body = JSON.stringify({
      ...payload,
      ua: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ts: new Date().toISOString(),
    })
    // keepalive agar tetap terkirim walau pengguna berpindah/menutup tab.
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-epub-report': '1' },
      body,
      keepalive: true,
    }).catch(() => {
      /* telemetri tak boleh mengganggu pengguna */
    })
  } catch {
    /* abaikan total */
  }
}
