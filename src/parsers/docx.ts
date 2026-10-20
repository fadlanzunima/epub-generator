import type { ContentBlock } from '@core/types'
import { htmlToBlocks } from './htmlToBlocks'

export interface DocxParseResult {
  blocks: ContentBlock[]
  warnings: string[]
}

/**
 * Parse .docx -> ContentBlock[] menggunakan Mammoth (di-lazy-load agar bundle
 * awal tetap ringan). Mammoth menghasilkan HTML semantik (membuang style font
 * keras Word), lalu htmlToBlocks membersihkannya menjadi IR.
 */
export async function parseDocx(arrayBuffer: ArrayBuffer): Promise<DocxParseResult> {
  const mammoth = await import('mammoth')
  const result = await mammoth.convertToHtml({ arrayBuffer })
  const doc = new DOMParser().parseFromString(`<body>${result.value}</body>`, 'text/html')
  return {
    blocks: htmlToBlocks(doc.body),
    warnings: result.messages.map((m) => m.message),
  }
}
