/**
 * Validasi OTORITATIF via epubcheck resmi (IDPF/W3C) — langkah CI.
 *
 * Membangun EPUB contoh dari engine (fixtures bersama dengan `npm run validate`),
 * lalu menjalankan epubcheck.jar memakai Java sistem. Jar diunduh & di-cache
 * otomatis ke `.epubcheck-cache/` (via jszip — tanpa dependency npm baru).
 *
 * Prasyarat: Java (JRE/JDK) di PATH, atau set JAVA_HOME / EPUBCHECK_JAVA.
 * CI: pakai actions/setup-java. Jalankan: npm run epubcheck
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import JSZip from 'jszip'
import { buildSampleEpubs } from './fixtures'

const VERSION = '5.1.0'
const DOWNLOAD = `https://github.com/w3c/epubcheck/releases/download/v${VERSION}/epubcheck-${VERSION}.zip`
const CACHE = join(process.cwd(), '.epubcheck-cache')

/** Temukan executable Java yang bisa dipakai. */
function resolveJava(): string | null {
  const candidates = [
    process.env.EPUBCHECK_JAVA,
    process.env.JAVA_HOME ? join(process.env.JAVA_HOME, 'bin', 'java') : undefined,
    'java',
  ].filter((x): x is string => Boolean(x))
  for (const j of candidates) {
    try {
      execFileSync(j, ['-version'], { stdio: 'ignore' })
      return j
    } catch {
      /* coba kandidat berikutnya */
    }
  }
  return null
}

/** Pastikan epubcheck.jar tersedia (unduh + ekstrak ke cache bila belum ada). */
async function ensureJar(): Promise<string> {
  const jar = join(CACHE, `epubcheck-${VERSION}`, 'epubcheck.jar')
  if (existsSync(jar)) return jar
  console.log(`Mengunduh epubcheck ${VERSION} …`)
  const res = await fetch(DOWNLOAD)
  if (!res.ok) throw new Error(`unduh epubcheck gagal: HTTP ${res.status}`)
  const zip = await JSZip.loadAsync(await res.arrayBuffer())
  for (const [name, file] of Object.entries(zip.files)) {
    if (file.dir) continue
    const dest = join(CACHE, name)
    mkdirSync(dirname(dest), { recursive: true })
    writeFileSync(dest, await file.async('nodebuffer'))
  }
  if (!existsSync(jar)) throw new Error('epubcheck.jar tidak ditemukan setelah ekstraksi')
  return jar
}

const java = resolveJava()
if (!java) {
  console.error(
    'Java tidak ditemukan. Pasang JRE/JDK lalu set PATH atau JAVA_HOME.\n' +
      'CI: gunakan actions/setup-java (distribution: temurin). ' +
      'Validasi non-Java tetap tersedia via `npm run validate`.',
  )
  process.exit(1)
}

const jar = await ensureJar()
const samples = await buildSampleEpubs()
const outDir = mkdtempSync(join(tmpdir(), 'epubcheck-'))

let failed = 0
for (const s of samples) {
  const file = join(outDir, `${s.name}.epub`)
  writeFileSync(file, s.bytes)
  console.log(`\n=== epubcheck: ${s.label} ===`)
  try {
    const out = execFileSync(java, ['-jar', jar, file], { encoding: 'utf8', stdio: 'pipe' })
    process.stdout.write(out)
  } catch (e) {
    failed++
    const err = e as { stdout?: string; stderr?: string }
    process.stdout.write((err.stdout ?? '') + (err.stderr ?? ''))
  }
}

console.log(
  failed === 0
    ? `\n=== epubcheck ${VERSION}: SEMUA LULUS (${samples.length} EPUB, 0 error) ===`
    : `\n=== epubcheck ${VERSION}: ${failed}/${samples.length} EPUB BERMASALAH ===`,
)
process.exit(failed === 0 ? 0 : 1)
