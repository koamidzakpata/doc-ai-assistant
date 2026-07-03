import Groq from 'groq-sdk'
import dotenv from 'dotenv'

dotenv.config()

const apiKey = process.env.GROQ_API_KEY

if (!apiKey) {
  console.error('GROQ_API_KEY est manquante. Vérifie ton fichier .env')
}

const groq = new Groq({ apiKey })

export interface ChatHistoryEntry {
  role: 'user' | 'ai'
  text: string
}

export async function sendChatMessage(
  userMessage: string,
  context?: string,
  history: ChatHistoryEntry[] = []
): Promise<string> {
  try {
    const systemPrompt = context
      ? `Tu es un assistant IA qui répond aux questions en te basant sur le contexte documentaire fourni. Voici le contexte pertinent extrait des documents de l'utilisateur :\n\n${context}\n\nRéponds à la question de l'utilisateur en te basant sur ce contexte si elle s'y rapporte. Sinon, réponds normalement en tenant compte de l'historique de la conversation. Si le contexte ne contient pas l'information nécessaire, dis-le clairement.`
      : 'Tu es un assistant IA utile et concis. Réponds en français, en tenant compte de l\'historique de la conversation.'

    const historyMessages = history.map((entry) => ({
      role: entry.role === 'user' ? ('user' as const) : ('assistant' as const),
      content: entry.text,
    }))

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: userMessage },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    })

    return completion.choices[0]?.message?.content || 'Aucune réponse reçue.'
  } catch (error) {
    console.error('Erreur lors de l\'appel à Groq:', error)
    return 'Erreur : impossible de contacter le service IA. Vérifiez votre connexion et votre clé API.'
  }
}

export function isGroqConfigured(): boolean {
  return !!apiKey
}