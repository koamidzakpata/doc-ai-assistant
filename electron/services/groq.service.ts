import Groq from 'groq-sdk'
import { getApiKey } from '../store.js'

export interface ChatHistoryEntry {
  role: 'user' | 'ai'
  text: string
}

export type ChatStreamResult =
  | { type: 'text'; content: string }
  | { type: 'document'; format: 'pdf' | 'docx' | 'txt'; filename: string; content: string }

interface ToolCallAccumulatorEntry {
  id?: string
  name?: string
  argumentsJson: string
}

function getGroqClient(): Groq {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error('GROQ_API_KEY est manquante. Configurez votre clé API.')
  }
  return new Groq({ apiKey })
}

const DOCUMENT_REQUEST_KEYWORDS = [
  'génère', 'genere', 'générer', 'generer',
  'créer un document', 'crée un document', 'creer un document', 'cree un document',
  'produis un document', 'fais-moi un document', 'fais moi un document',
  'télécharge', 'telecharge', 'téléchargement', 'telechargement',
  'exporte', 'exporter', 'export',
  'convertis', 'convertir', 'conversion',
  'en pdf', 'en docx', 'en txt',
  'sous forme de pdf', 'sous forme de docx', 'sous forme de txt',
  'format pdf', 'format docx', 'format txt',
  'résumé au format', 'resume au format',
]

// Retire les points avant comparaison, pour que "format .txt" corresponde
// au même mot-clé que "format txt" — sinon la ponctuation casse le match.
function isDocumentRequest(message: string): boolean {
  const normalized = message.toLowerCase().replace(/\./g, '')
  return DOCUMENT_REQUEST_KEYWORDS.some((kw) => normalized.includes(kw))
}

const documentTools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'create_document',
      description:
        "Génère un document téléchargeable (PDF, DOCX ou TXT) à partir d'un contenu textuel. " +
        "N'appelle cet outil QUE si le DERNIER message de l'utilisateur demande explicitement de produire, " +
        "générer, résumer, convertir ou exporter un document dans un format précis. Ne l'appelle JAMAIS pour " +
        "un message de remerciement, de confirmation ('ok', 'merci', 'c'est bon') ou de discussion normale, " +
        "même si un document a été généré précédemment dans la conversation.",
      parameters: {
        type: 'object',
        properties: {
          format: {
            type: 'string',
            enum: ['pdf', 'docx', 'txt'],
            description: 'Le format du document à générer',
          },
          filename: {
            type: 'string',
            description:
              "Nom de fichier descriptif SANS extension, basé sur le contenu (ex: 'resume-rapport-ventes')",
          },
          content: {
            type: 'string',
            description:
              "Une VÉRITABLE synthèse rédigée par toi-même en français, PAS une copie du texte fourni en contexte. " +
              "RÈGLES OBLIGATOIRES : " +
              "1) Traite TOUS les documents présents dans le contexte fourni, un par un, sans en omettre aucun — " +
              "vérifie que chaque nom de fichier mentionné dans le contexte apparaît bien dans ta synthèse. " +
              "2) Pour CHAQUE document, rédige un paragraphe dédié d'au moins 3 à 5 phrases précises : " +
              "le sujet exact traité, les éléments concrets qu'il contient (thèmes, sections, exemples, données, code...), " +
              "et son objectif apparent. Évite les formulations vagues et génériques comme 'ce document parle de X' — " +
              "donne des détails spécifiques tirés du contenu réel. " +
              "3) Ignore uniquement les pages de garde, mentions de licence/copyright et en-têtes non pertinents. " +
              "4) Structure avec un titre en gras pour chaque document (nom du fichier), suivi de son paragraphe.",
          },
        },
        required: ['format', 'filename', 'content'],
      },
    },
  },
]

export async function streamChatMessage(
  userMessage: string,
  context: string | undefined,
  history: ChatHistoryEntry[],
  onChunk: (chunk: string) => void
): Promise<ChatStreamResult> {
  const MAX_ATTEMPTS = 2

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await attemptStreamChatMessage(userMessage, context, history, onChunk)
    } catch (error: any) {
      const isToolUseFailed = error?.error?.code === 'tool_use_failed'
      const isLastAttempt = attempt === MAX_ATTEMPTS

      if (isToolUseFailed && !isLastAttempt) {
        console.warn(`Tentative ${attempt} échouée (tool_use_failed), nouvelle tentative...`)
        continue
      }

      throw error
    }
  }

  throw new Error('Échec inattendu de streamChatMessage.')
}

async function attemptStreamChatMessage(
  userMessage: string,
  context: string | undefined,
  history: ChatHistoryEntry[],
  onChunk: (chunk: string) => void
): Promise<ChatStreamResult> {
  const groq = getGroqClient()

  const systemPrompt = context
    ? `Tu es un assistant IA qui répond aux questions en te basant sur le contexte documentaire fourni. Voici le contexte pertinent extrait des documents de l'utilisateur :\n\n${context}\n\nRéponds à la question de l'utilisateur en te basant sur ce contexte si elle s'y rapporte. Sinon, réponds normalement en tenant compte de l'historique de la conversation. Si le contexte ne contient pas l'information nécessaire, dis-le clairement.`
    : 'Tu es un assistant IA utile et concis. Réponds en français, en tenant compte de l\'historique de la conversation.'

  const historyMessages = history.map((entry) => ({
    role: entry.role === 'user' ? ('user' as const) : ('assistant' as const),
    content: entry.text,
  }))

  const shouldOfferDocumentTool = isDocumentRequest(userMessage)

  const stream = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      ...historyMessages,
      { role: 'user', content: userMessage },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 6144, // augmenté pour permettre des résumés détaillés couvrant tous les documents
    stream: true,
    ...(shouldOfferDocumentTool ? { tools: documentTools, tool_choice: 'auto' as const } : {}),
  })

  let fullText = ''
  const toolCallsAccumulator: Record<number, ToolCallAccumulatorEntry> = {}

  for await (const part of stream) {
    const delta = part.choices[0]?.delta

    if (delta?.content) {
      fullText += delta.content
      onChunk(delta.content)
    }

    if (delta?.tool_calls) {
      for (const toolCallDelta of delta.tool_calls) {
        const index = toolCallDelta.index
        if (!toolCallsAccumulator[index]) {
          toolCallsAccumulator[index] = { argumentsJson: '' }
        }
        if (toolCallDelta.id) {
          toolCallsAccumulator[index].id = toolCallDelta.id
        }
        if (toolCallDelta.function?.name) {
          toolCallsAccumulator[index].name = toolCallDelta.function.name
        }
        if (toolCallDelta.function?.arguments) {
          toolCallsAccumulator[index].argumentsJson += toolCallDelta.function.arguments
        }
      }
    }
  }

  const toolCalls = Object.values(toolCallsAccumulator)
  const documentCall = toolCalls.find((tc) => tc.name === 'create_document')

  if (documentCall) {
    const args = JSON.parse(documentCall.argumentsJson) as {
      format: 'pdf' | 'docx' | 'txt'
      filename: string
      content: string
    }
    return { type: 'document', format: args.format, filename: args.filename, content: args.content }
  }

  return { type: 'text', content: fullText || 'Aucune réponse reçue.' }
}

export function isGroqConfigured(): boolean {
  return !!getApiKey()
}