import fs from 'node:fs/promises'
import path from 'node:path'

export interface ParsedDocument {
  fileName: string
  content: string
}

async function parsePdf(filePath: string): Promise<string> {
  const { PDFParse } = await import('pdf-parse')
  const buffer = await fs.readFile(filePath)
  const parser = new PDFParse({ data: buffer })
  const result = await parser.getText()
  await parser.destroy()
  return result.text
}

async function parseDocx(filePath: string): Promise<string> {
  const mammoth = await import('mammoth')
  const buffer = await fs.readFile(filePath)
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

async function parseTxt(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8')
}

export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  const extension = path.extname(filePath).toLowerCase()
  const fileName = path.basename(filePath)

  let content = ''

  switch (extension) {
    case '.pdf':
      content = await parsePdf(filePath)
      break
    case '.docx':
      content = await parseDocx(filePath)
      break
    case '.txt':
      content = await parseTxt(filePath)
      break
    default:
      throw new Error(`Format de fichier non supporté : ${extension}`)
  }

  return { fileName, content }
}