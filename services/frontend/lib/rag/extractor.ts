// Text extraction from PDF, DOCX, XLSX, plain text
// Images/scanned PDFs fall back to Gemini OCR

export async function extractText(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  // Plain text
  if (mimeType === 'text/plain') {
    return buffer.toString('utf-8')
  }

  // PDF
  if (mimeType === 'application/pdf') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfParse = ((await import('pdf-parse')) as any).default ?? (await import('pdf-parse'))
      const data = await pdfParse(buffer)
      if (data.text && data.text.trim().length > 100) return data.text
      // If very little text, it's likely a scanned PDF — use Gemini OCR
      return geminiOCR(buffer, mimeType)
    } catch {
      return geminiOCR(buffer, mimeType)
    }
  }

  // DOCX
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  // XLSX
  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimeType === 'application/vnd.ms-excel') {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const lines: string[] = []
    workbook.SheetNames.forEach(name => {
      lines.push(`=== Sheet: ${name} ===`)
      const ws = workbook.Sheets[name]
      lines.push(XLSX.utils.sheet_to_csv(ws))
    })
    return lines.join('\n')
  }

  // Images — send to Gemini OCR
  if (mimeType.startsWith('image/')) {
    return geminiOCR(buffer, mimeType)
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}

async function geminiOCR(buffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const base64 = buffer.toString('base64')
  const result = await model.generateContent([
    {
      inlineData: { mimeType: mimeType as 'application/pdf' | 'image/png' | 'image/jpeg', data: base64 }
    },
    'Extract all text from this document. Return only the extracted text, preserving structure and paragraphs.',
  ])
  return result.response.text()
}
