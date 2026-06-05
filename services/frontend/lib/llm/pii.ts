// Basic PII detection — regex-based, no external service needed

const PII_PATTERNS: { type: string; pattern: RegExp }[] = [
  { type: 'EMAIL',       pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
  { type: 'PHONE',       pattern: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { type: 'EMPLOYEE_ID', pattern: /\b(EMP|emp|ID|id)[-#]?\d{4,8}\b/g },
  { type: 'SSN',         pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { type: 'AADHAAR',     pattern: /\b\d{4}\s?\d{4}\s?\d{4}\b/g },
]

export interface PIIResult {
  hasPII: boolean
  types: string[]
  masked: string
}

export function scanAndMask(text: string): PIIResult {
  const foundTypes: string[] = []
  let masked = text

  for (const { type, pattern } of PII_PATTERNS) {
    pattern.lastIndex = 0
    if (pattern.test(text)) {
      foundTypes.push(type)
      pattern.lastIndex = 0
      masked = masked.replace(pattern, `[${type}_REDACTED]`)
    }
  }

  return { hasPII: foundTypes.length > 0, types: foundTypes, masked }
}
