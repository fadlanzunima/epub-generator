/**
 * Zona unggah dokumen: input file + drag-and-drop, 100% client-side.
 * Menerima format Fase 1: .docx .md .txt .csv .xlsx.
 */
import { useCallback, useRef, useState } from 'react'

const ACCEPT = '.docx,.md,.markdown,.txt,.csv,.xlsx,.xls,.pdf'

export function Dropzone({
  onFile,
  busy,
}: {
  onFile: (file: File) => void
  busy: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const pick = useCallback(() => inputRef.current?.click(), [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        if (!busy) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={busy ? (e) => e.preventDefault() : onDrop}
      className={`flex w-full flex-col items-center gap-4 border-eink ${
        dragging ? 'border-dashed' : ''
      } border-black bg-white px-6 py-10 text-center`}
    >
      <p className="font-ui text-subtitle text-ink">
        {busy ? 'Memproses dokumen…' : 'Seret berkas ke sini'}
      </p>
      <p className="font-ui text-body text-ink-muted">
        .docx · .md · .txt · .csv · .xlsx · .pdf — diproses sepenuhnya di perangkat Anda
      </p>
      <button type="button" className="btn-eink btn-eink--inverted" onClick={pick} disabled={busy}>
        Pilih Berkas
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}
