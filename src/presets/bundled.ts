/**
 * Preset bawaan offline (brief: Built-in Starter Library). Materi public-domain
 * ringkas yang dipaket di dalam aplikasi — tidak butuh jaringan, langsung jadi
 * EPUB. Memakai pipeline parser biasa (Markdown -> IR) agar konsisten.
 */
import { assembleIR, parseMarkdown } from '@parsers'
import type { DocumentIR } from '@core/types'

const UUD_1945_PEMBUKAAN = `# Pembukaan Undang-Undang Dasar 1945

## Alinea Pertama

Bahwa sesungguhnya kemerdekaan itu ialah hak segala bangsa dan oleh sebab itu,
maka penjajahan di atas dunia harus dihapuskan, karena tidak sesuai dengan
perikemanusiaan dan perikeadilan.

## Alinea Kedua

Dan perjuangan pergerakan kemerdekaan Indonesia telah sampailah kepada saat yang
berbahagia dengan selamat sentausa mengantarkan rakyat Indonesia ke depan pintu
gerbang kemerdekaan negara Indonesia, yang merdeka, bersatu, berdaulat, adil dan
makmur.

## Alinea Ketiga

Atas berkat rahmat Allah Yang Maha Kuasa dan dengan didorongkan oleh keinginan
luhur, supaya berkehidupan kebangsaan yang bebas, maka rakyat Indonesia menyatakan
dengan ini kemerdekaannya.

## Alinea Keempat

Kemudian daripada itu untuk membentuk suatu Pemerintah Negara Indonesia yang
melindungi segenap bangsa Indonesia dan seluruh tumpah darah Indonesia dan untuk
memajukan kesejahteraan umum, mencerdaskan kehidupan bangsa, dan ikut melaksanakan
ketertiban dunia yang berdasarkan kemerdekaan, perdamaian abadi dan keadilan sosial,
maka disusunlah kemerdekaan kebangsaan Indonesia itu dalam suatu Undang-Undang Dasar
Negara Indonesia, yang terbentuk dalam suatu susunan Negara Republik Indonesia yang
berkedaulatan rakyat dengan berdasar kepada: Ketuhanan Yang Maha Esa, kemanusiaan
yang adil dan beradab, persatuan Indonesia, dan kerakyatan yang dipimpin oleh hikmat
kebijaksanaan dalam permusyawaratan/perwakilan, serta dengan mewujudkan suatu
keadilan sosial bagi seluruh rakyat Indonesia.`

/** Pembukaan UUD 1945 (public domain) — preset offline. */
export function buildUUD1945IR(): DocumentIR {
  return assembleIR(parseMarkdown(UUD_1945_PEMBUKAAN), {
    baseName: 'Pembukaan UUD 1945',
    source: 'Preset bawaan (public domain)',
    language: 'id',
  })
}
