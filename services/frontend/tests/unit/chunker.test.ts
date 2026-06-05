import { describe, it, expect } from 'vitest'
import { chunkText } from '@/lib/rag/chunker'

const SHORT = 'This is a short sentence.'
const MEDIUM = Array(30).fill('This is a sentence about refinery operations safety.').join(' ')
const LONG = Array(200).fill('Operators must follow the standard operating procedure for confined space entry.').join(' ')

describe('Text Chunker', () => {
  describe('basic splitting', () => {
    it('returns a single chunk for short text', () => {
      const chunks = chunkText(SHORT)
      expect(chunks).toHaveLength(1)
      expect(chunks[0].text).toContain('short sentence')
    })

    it('returns multiple chunks for long text', () => {
      const chunks = chunkText(LONG)
      expect(chunks.length).toBeGreaterThan(1)
    })

    it('assigns sequential indexes', () => {
      const chunks = chunkText(LONG)
      chunks.forEach((c, i) => expect(c.index).toBe(i))
    })

    it('assigns token counts to all chunks', () => {
      const chunks = chunkText(LONG)
      chunks.forEach(c => expect(c.tokenCount).toBeGreaterThan(0))
    })
  })

  describe('chunk size', () => {
    it('no chunk exceeds 600 tokens (~2400 chars)', () => {
      const chunks = chunkText(LONG)
      chunks.forEach(c => expect(c.tokenCount).toBeLessThanOrEqual(600))
    })

    it('all chunks have non-empty text', () => {
      const chunks = chunkText(LONG)
      chunks.forEach(c => expect(c.text.trim().length).toBeGreaterThan(0))
    })
  })

  describe('edge cases', () => {
    it('handles empty string gracefully', () => {
      const chunks = chunkText('')
      expect(chunks).toHaveLength(0)
    })

    it('handles single word', () => {
      const chunks = chunkText('Refinery')
      expect(chunks).toHaveLength(1)
      expect(chunks[0].text).toBe('Refinery')
    })

    it('handles text with only newlines', () => {
      const chunks = chunkText('\n\n\n\n')
      expect(chunks).toHaveLength(0)
    })

    it('handles medium text without over-splitting', () => {
      const chunks = chunkText(MEDIUM)
      // Medium text should produce a small number of chunks
      expect(chunks.length).toBeLessThan(10)
    })
  })

  describe('page hints', () => {
    it('assigns page hints as positive integers when derivable', () => {
      const chunks = chunkText(LONG)
      chunks
        .filter(c => c.pageHint !== undefined)
        .forEach(c => expect(c.pageHint).toBeGreaterThan(0))
    })
  })
})
