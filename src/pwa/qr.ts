import QRCode from 'qrcode'

/**
 * QR Code (Fase 6): membuka aplikasi di perangkat lain (mis. e-reader/ponsel
 * yang men-scan untuk membuka PWA lalu memasang/menggunakannya di sana).
 * Grayscale High-Contrast agar ramah kamera E-Ink & cetak.
 */
export async function appUrlQrDataUrl(url: string = window.location.origin): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 2,
    scale: 6,
    color: { dark: '#000000', light: '#ffffff' },
  })
}
