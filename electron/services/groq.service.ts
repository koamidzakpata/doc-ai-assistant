import Groq from 'groq-sdk'
import { getApiKey } from '../store.js'

export interface ChatHistoryEntry {
  role: 'user' | 'ai'
  text: string
}

function getGroqClient(): Groq {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('GROQ_API_KEY est manquante. Configurez votre clé API.')
  }
  return new Groq({ apiKey })
}

export async function streamChatMessage(
  userMessage: string,
  context: string | undefined,
  history: ChatHistoryEntry[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const groq = getGroqClient()

  const systemPrompt = context
    ? `Tu es un assistant IA qui répond aux questions en te basant sur le contexte documentaire fourni. Voici le contexte pertinent extrait des documents de l'utilisateur :\n\n${context}\n\nRéponds à la question de l'utilisateur en te basant sur ce contexte si elle s'y rapporte. Sinon, réponds normalement en tenant compte de l'historique de la conversation. Si le contexte ne contient pas l'information nécessaire, dis-le clairement.`
    : 'Tu es un assistant IA utile et concis. Réponds en français, en tenant compte de l\'historique de la conversation.'

  const historyMessages = history.map((entry) => ({
    role: entry.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: entry.text,
  }))

  const stream = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userMessage },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 1024,
    stream: true,
  })

  let fullText = ''

  for await (const part of stream) {
    const delta = part.choices[0]?.delta?.content || ''
    if (delta) {
      fullText += delta
      onChunk(delta)
    }
  }

  return fullText || 'Aucune réponse reçue.'
}

export function isGroqConfigured(): boolean {
  return !!getApiKey()
}