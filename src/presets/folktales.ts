/**
 * Cerita Rakyat Indonesia (brief: Starter Library — buku anak/materi populer).
 * Dongeng tradisional = **folklor domain publik**; teks di sini adalah penceritaan
 * ulang ringkas untuk dipaket OFFLINE (seperti UUD 1945) — tanpa ketergantungan
 * API/jaringan. Memakai pipeline Markdown → IR agar konsisten (judul H1, adegan H2
 * memicu chapter-split & TOC).
 */
import { assembleIR, parseMarkdown } from '@parsers'
import type { DocumentIR } from '@core/types'

const MALIN_KUNDANG = `# Malin Kundang

## Anak yang Merantau

Di sebuah desa nelayan di pesisir Sumatra Barat, hiduplah seorang janda miskin
bersama anak lelakinya, Malin Kundang. Mereka hidup sederhana dari hasil melaut.
Karena ingin mengubah nasib, Malin memutuskan merantau dengan sebuah kapal dagang
yang singgah di kampungnya. Sang ibu melepasnya dengan air mata dan doa.

## Menjadi Kaya

Bertahun-tahun berlalu. Di negeri seberang, Malin bekerja keras, berdagang, dan
akhirnya menjadi saudagar kaya. Ia menikahi seorang putri bangsawan dan memiliki
kapal besar yang megah. Namun kekayaan membuatnya lupa akan kampung halaman dan
ibunya yang renta.

## Kutukan Sang Ibu

Suatu hari kapal Malin berlabuh di kampung asalnya. Mendengar kabar itu, sang ibu
bergegas ke pelabuhan. Namun Malin malu mengakui ibunya yang miskin di hadapan
istrinya, dan ia mengusirnya dengan kasar. Hancur hatinya, sang ibu berdoa, "Ya
Tuhan, jika benar ia anakku, hukumlah ia." Seketika badai datang, dan Malin Kundang
berubah menjadi batu — peringatan abadi bagi anak yang durhaka kepada orang tua.`

const TIMUN_MAS = `# Timun Mas

## Hadiah dari Raksasa

Seorang janda tua sangat merindukan anak. Ia memohon kepada seorang raksasa, yang
memberinya biji mentimun ajaib. "Rawatlah, kelak tumbuh seorang anak. Tetapi saat
ia berumur enam tahun, serahkan ia kepadaku," kata raksasa itu. Dari mentimun emas
yang merekah, lahirlah seorang gadis cantik bernama Timun Mas.

## Janji yang Ditagih

Timun Mas tumbuh menjadi gadis periang. Ketika tiba waktunya, raksasa datang menagih
janji. Sang ibu tak sampai hati menyerahkan anaknya. Ia membekali Timun Mas empat
bungkusan ajaib — biji mentimun, jarum, garam, dan terasi — lalu menyuruhnya lari.

## Melarikan Diri

Raksasa mengejar. Timun Mas menebar biji mentimun; tumbuhlah kebun lebat. Ia menebar
jarum; tumbuhlah hutan bambu runcing. Ia menebar garam; terbentang lautan luas. Saat
raksasa hampir menangkapnya, Timun Mas menebar terasi; seketika muncul lautan lumpur
mendidih yang menelan sang raksasa. Timun Mas selamat dan hidup bahagia bersama ibunya.`

const SANGKURIANG = `# Sangkuriang

## Perburuan yang Malang

Dayang Sumbi memiliki seorang putra bernama Sangkuriang dan seekor anjing setia
bernama Tumang. Suatu hari Sangkuriang berburu, tetapi Tumang tak mau menuruti
perintahnya. Dalam kemarahan, Sangkuriang mencelakai Tumang. Mengetahui hal itu,
Dayang Sumbi murka dan tanpa sengaja melukai kepala Sangkuriang, lalu mengusirnya.

## Pertemuan Kembali

Bertahun-tahun kemudian, Sangkuriang yang telah dewasa kembali mengembara dan
bertemu seorang perempuan cantik — tanpa menyadari bahwa ia adalah Dayang Sumbi,
ibunya sendiri yang awet muda. Keduanya saling jatuh cinta dan berniat menikah.

## Perahu yang Terbalik

Dayang Sumbi mengenali bekas luka di kepala Sangkuriang dan menyadari siapa ia.
Untuk menggagalkan pernikahan, ia meminta syarat mustahil: membuat danau dan sebuah
perahu dalam satu malam. Dengan bantuan makhluk gaib, Sangkuriang hampir berhasil.
Dayang Sumbi lalu menebar kain merah di timur sehingga fajar seakan terbit. Mengira
gagal, Sangkuriang marah dan menendang perahunya hingga terbalik — konon menjadi
Gunung Tangkuban Perahu di tanah Sunda.`

function tale(markdown: string): DocumentIR {
  return assembleIR(parseMarkdown(markdown), {
    baseName: markdown.split('\n')[0].replace(/^#\s*/, '').trim(),
    source: 'Cerita rakyat (folklor domain publik, dipaket offline)',
    language: 'id',
  })
}

export const buildMalinKundangIR = (): DocumentIR => tale(MALIN_KUNDANG)
export const buildTimunMasIR = (): DocumentIR => tale(TIMUN_MAS)
export const buildSangkuriangIR = (): DocumentIR => tale(SANGKURIANG)
