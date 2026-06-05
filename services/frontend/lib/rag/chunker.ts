// Text chunker — recursive character splitting
// 512 token target, 50 token overlap

const CHUNK_SIZE = 512   // approximate tokens (1 token ≈ 4 chars)
const OVERLAP    = 50
const SEPARATORS = ['\n\n', '\n', '. ', ' ', '']

function charCount(text: string): number {
  return Math.ceil(text.length / 4) // rough token estimate
}

function splitOn(text: string, separator: string): string[] {
  return separator ? text.split(separator) : text.split('')
}

export interface Chunk {
  index: number
  text: string
  tokenCount: number
  pageHint?: number  // estimated page number based on position
}

export function chunkText(text: string): Chunk[] {
  const chunks: string[] = []

  function split(t: string, sepIdx = 0): void {
    if (charCount(t) <= CHUNK_SIZE) { if (t.trim()) chunks.push(t.trim()); return }
    const sep = SEPARATORS[sepIdx] ?? ''
    const parts = splitOn(t, sep).filter(p => p.trim())
    let current = ''
    for (const part of parts) {
      const candidate = current ? current + sep + part : part
      if (charCount(candidate) <= CHUNK_SIZE) {
        current = candidate
      } else {
        if (current.trim()) chunks.push(current.trim())
        if (charCount(part) > CHUNK_SIZE && sepIdx + 1 < SEPARATORS.length) {
          split(part, sepIdx + 1)
          current = ''
        } else {
          current = part
        }
      }
    }
    if (current.trim()) chunks.push(current.trim())
  }

  split(text)

  // Apply overlap — prepend tail of previous chunk
  const result: Chunk[] = []
  const totalChars = text.length

  for (let i = 0; i < chunks.length; i++) {
    let chunkText = chunks[i]
    if (i > 0 && OVERLAP > 0) {
      const prev = chunks[i - 1]
      const overlapChars = OVERLAP * 4
      const tail = prev.slice(-overlapChars)
      chunkText = tail + ' ' + chunkText
    }
    // Estimate page number (assumes ~3000 chars per page)
    const position = text.indexOf(chunks[i])
    const pageHint = position >= 0 ? Math.floor(position / 3000) + 1 : undefined

    result.push({
      index: i,
      text: chunkText.trim(),
      tokenCount: charCount(chunkText),
      pageHint,
    })
  }

  return result
}
