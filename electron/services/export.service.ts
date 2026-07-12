import { Document, Packer, Paragraph, TextRun } from 'docx'
import PDFDocument from 'pdfkit'
import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'

export type DocumentFormat = 'pdf' | 'docx' | 'txt'

// Génère le fichier dans un dossier temporaire de l'app, et retourne son chemin.
// Ce fichier n'est pas encore la destination finale — voir export.handler.ts pour le "Enregistrer sous".
export async function generateDocumentFile(
  format: DocumentFormat,
  filename: string,
  content: string
): Promise<string> {
  const tempDir = path.join(app.getPath('temp'), 'doc-ai-assistant-exports')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }

  const safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_')
  const filePath = path.join(tempDir, `${safeFilename}.${format}`)

  if (format === 'txt') {
    fs.writeFileSync(filePath, content, 'utf-8')
    return filePath
  }

  if (format === 'docx') {
    const paragraphs = content.split('\n').map(
      (line) =>
        new Paragraph({
          children: [new TextRun(line)],
        })
    )

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    })

    const buffer = await Packer.toBuffer(doc)
    fs.writeFileSync(filePath, buffer)
    return filePath
  }

  if (format === 'pdf') {
    await new Promise<void>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 })
      const writeStream = fs.createWriteStream(filePath)

      doc.pipe(writeStream)
      doc.fontSize(12).text(content, { align: 'left' })
      doc.end()

      writeStream.on('finish', () => resolve())
      writeStream.on('error', reject)
    })
    return filePath
  }

  throw new Error(`Format non supporté : ${format}`)
}