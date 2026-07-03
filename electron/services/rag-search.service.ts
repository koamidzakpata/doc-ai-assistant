import type { ParsedDocument } from './document-parser.service.js'

export interface DocumentChunk {
  fileName: string
  text: string
  score?: number
}

const CHUNK_SIZE = 500
const CHUNK_OVERLAP = 50

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length)
    chunks.push(text.slice(start, end))
    start += CHUNK_SIZE - CHUNK_OVERLAP
  }

  return chunks.filter((chunk) => chunk.trim().length > 0)
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function extractKeywords(query: string): string[] {
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'et', 'ou', 'est',
    'que', 'qui', 'quoi', 'comment', 'pourquoi', 'dans', 'sur', 'avec',
    'pour', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'tu', 'je', 'il',
    'elle', 'nous', 'vous', 'ils', 'elles', 'a', 'au', 'aux',
  ])

  return normalize(query)
    .split(/\W+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
}

function scoreChunk(chunkText: string, keywords: string[]): number {
  const normalizedChunk = normalize(chunkText)
  let score = 0

  for (const keyword of keywords) {
    const matches = normalizedChunk.split(keyword).length - 1
    score += matches
  }

  return score
}

export function searchRelevantChunks(
  query: string,
  documents: ParsedDocument[],
  topK?: number
): DocumentChunk[] {
  const keywords = extractKeywords(query)

  if (keywords.length === 0 || documents.length === 0) {
    return []
  }

  const effectiveTopK = topK ?? Math.max(4, documents.length * 2)

  const chunksByDocument = new Map<string, DocumentChunk[]>()

  for (const doc of documents) {
    const textChunks = splitIntoChunks(doc.content)
    const scoredChunks: DocumentChunk[] = []

    for (const text of textChunks) {
      const score = scoreChunk(text, keywords)
      scoredChunks.push({ fileName: doc.fileName, text, score })
    }

    scoredChunks.sort((a, b) => (b.score || 0) - (a.score || 0))
    chunksByDocument.set(doc.fileName, scoredChunks)
  }

  const perDocumentMinimum = Math.max(1, Math.floor(effectiveTopK / documents.length))
  const guaranteedChunks: DocumentChunk[] = []

  for (const [, chunks] of chunksByDocument) {
    guaranteedChunks.push(...chunks.slice(0, perDocumentMinimum))
  }

  const remainingSlots = Math.max(0, effectiveTopK - guaranteedChunks.length)

  if (remainingSlots > 0) {
    const remainingChunks: DocumentChunk[] = []
    for (const [, chunks] of chunksByDocument) {
      remainingChunks.push(...chunks.slice(perDocumentMinimum))
    }
    remainingChunks.sort((a, b) => (b.score || 0) - (a.score || 0))
    guaranteedChunks.push(...remainingChunks.slice(0, remainingSlots))
  }

  return guaranteedChunks
}

export function buildContextFromChunks(chunks: DocumentChunk[]): string {
  if (chunks.length === 0) {
    return ''
  }

  return chunks
    .map((chunk) => `[Extrait de ${chunk.fileName}]\n${chunk.text}`)
    .join('\n\n---\n\n')
}