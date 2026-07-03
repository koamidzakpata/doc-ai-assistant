import { ipcMain } from 'electron'
import { sendChatMessage, isGroqConfigured } from '../services/groq.service.js'
import { getConversationDocuments, getConversation } from '../services/conversations.service.js'
import { searchRelevantChunks, buildContextFromChunks } from '../services/rag-search.service.js'

const SUMMARY_KEYWORDS = ['résumé', 'resume', 'résume', 'tous les documents', 'tout les documents', 'chaque document', 'l\'ensemble des documents']
const MAX_HISTORY_MESSAGES = 10

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
  ipcMain.handle('chat:send', async (_event, conversationId: string, message: string) => {
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

    // On exclut le tout dernier message (celui qu'on vient de recevoir, déjà
    // ajouté côté frontend avant cet appel) pour ne pas le dupliquer.
    const historyOnly = allMessages.slice(0, -1).slice(-MAX_HISTORY_MESSAGES)

    const history = historyOnly.map((m) => ({ role: m.role, text: m.text }))

    const response = await sendChatMessage(message, context, history)
    return response
  })

  ipcMain.handle('chat:status', async () => {
    return isGroqConfigured()
  })
}