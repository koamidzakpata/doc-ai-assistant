import { ipcMain } from 'electron'
import { streamChatMessage, isGroqConfigured } from '../services/groq.service.js'
import { getConversationDocuments, getConversation } from '../services/conversations.service.js'
import { searchRelevantChunks, buildContextFromChunks } from '../services/rag-search.service.js'

const SUMMARY_KEYWORDS = ['résumé', 'resume', 'résume', 'tous les documents', 'tout les documents', 'chaque document', 'l\'ensemble des documents']
const MAX_HISTORY_MESSAGES = 10

// Réponse envoyée au Renderer : soit du texte classique, soit un document
// à prévisualiser dans le panneau (ArtifactPanel), pas encore écrit sur le disque.
export type ChatHandlerResponse =
  | { type: 'text'; text: string }
  | { type: 'document'; format: 'pdf' | 'docx' | 'txt'; filename: string; content: string }

function isGlobalSummaryRequest(message: string): boolean {
  const normalized = message.toLowerCase()
  return SUMMARY_KEYWORDS.some((kw) => normalized.includes(kw))
}

function buildFullContext(documents: { fileName: string; content: string }[]): string {
  const MAX_CHARS_PER_DOC = 3000

  return documents
    .map((doc) => {
      const truncated = doc.content.length > MAX_CHARS_PER_DOC
        ? doc.content.slice(0, MAX_CHARS_PER_DOC) + '\n[...contenu tronqué...]'
        : doc.content
      return `[Document : ${doc.fileName}]\n${truncated}`
    })
    .join('\n\n=====\n\n')
}

export function registerChatHandlers() {
  ipcMain.handle('chat:send', async (event, conversationId: string, message: string): Promise<ChatHandlerResponse> => {
    const documents = getConversationDocuments(conversationId)

    let context: string | undefined

    if (documents.length > 0) {
      if (isGlobalSummaryRequest(message)) {
        context = buildFullContext(documents)
      } else {
        const relevantChunks = searchRelevantChunks(message, documents)
        if (relevantChunks.length > 0) {
          context = buildContextFromChunks(relevantChunks)
        }
      }
    }

    const conversation = getConversation(conversationId)
    const allMessages = conversation?.messages ?? []

    const historyOnly = allMessages.slice(0, -1).slice(-MAX_HISTORY_MESSAGES)
    const history = historyOnly.map((m) => ({ role: m.role, text: m.text }))

    try {
      const result = await streamChatMessage(message, context, history, (chunk) => {
        event.sender.send('chat:chunk', chunk)
      })
      event.sender.send('chat:done')

      if (result.type === 'document') {
        return {
          type: 'document',
          format: result.format,
          filename: result.filename,
          content: result.content,
        }
      }

      return { type: 'text', text: result.content }
    } catch (error: any) {
      console.error('Erreur lors de l\'appel à Groq:', error)

      let errorMessage = 'Erreur : impossible de contacter le service IA. Vérifiez votre connexion et votre clé API.'

      if (error?.error?.code === 'tool_use_failed') {
        errorMessage = "Je n'ai pas réussi à générer le document correctement. Peux-tu reformuler ta demande ?"
      } else if (error?.status === 429 || error?.error?.error?.code === 'rate_limit_exceeded') {
        errorMessage = "Quota Groq quotidien atteint pour votre clé API. Réessayez plus tard, ou consultez console.groq.com/settings/billing pour plus de détails."
      }

      event.sender.send('chat:done')
      return { type: 'text', text: errorMessage }
    }
  })

  ipcMain.handle('chat:status', async () => {
    return isGroqConfigured()
  })
}