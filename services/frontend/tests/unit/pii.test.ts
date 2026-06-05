import { describe, it, expect } from 'vitest'
import { scanAndMask } from '@/lib/llm/pii'

describe('PII Scanner', () => {
  describe('detection', () => {
    it('detects email addresses', () => {
      const r = scanAndMask('Contact john.doe@company.com for details')
      expect(r.hasPII).toBe(true)
      expect(r.types).toContain('EMAIL')
    })

    it('detects phone numbers', () => {
      const r = scanAndMask('Call us at 555-123-4567')
      expect(r.hasPII).toBe(true)
      expect(r.types).toContain('PHONE')
    })

    it('detects employee IDs', () => {
      const r = scanAndMask('Employee EMP-12345 submitted the form')
      expect(r.hasPII).toBe(true)
      expect(r.types).toContain('EMPLOYEE_ID')
    })

    it('detects SSN', () => {
      const r = scanAndMask('SSN: 123-45-6789')
      expect(r.hasPII).toBe(true)
      expect(r.types).toContain('SSN')
    })

    it('returns no PII for clean text', () => {
      const r = scanAndMask('What is the SOP for confined space entry?')
      expect(r.hasPII).toBe(false)
      expect(r.types).toHaveLength(0)
    })

    it('detects multiple PII types in one string', () => {
      const r = scanAndMask('EMP-9999 can be reached at worker@refinery.com or 555-999-8888')
      expect(r.hasPII).toBe(true)
      expect(r.types.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('masking', () => {
    it('masks email in output', () => {
      const r = scanAndMask('Email: ops@refinery.com please')
      expect(r.masked).toContain('[EMAIL_REDACTED]')
      expect(r.masked).not.toContain('ops@refinery.com')
    })

    it('masks phone in output', () => {
      const r = scanAndMask('Phone: 555-123-4567')
      expect(r.masked).toContain('[PHONE_REDACTED]')
      expect(r.masked).not.toContain('555-123-4567')
    })

    it('preserves non-PII text around masked values', () => {
      const r = scanAndMask('Please contact john@example.com about the SOP.')
      expect(r.masked).toContain('Please contact')
      expect(r.masked).toContain('about the SOP.')
    })

    it('returns identical string when no PII found', () => {
      const input = 'What is the PPE requirement for the crude unit?'
      const r = scanAndMask(input)
      expect(r.masked).toBe(input)
    })
  })
})
