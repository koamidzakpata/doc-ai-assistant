<script lang="ts">
  import type { Message } from '../types/index.js'
  import { theme } from '../stores/theme.js'

  export const onMessageSend: (message: string) => Promise<string> = async () => ''
  export let conversationId: string = ''
  export let initialMessages: Message[] = []
  export let onConversationUpdate: () => void = () => {}

  let chatRef: any

  export function reset(messages: Message[] = []) {
    if (chatRef) {
      chatRef.clearMessages()
      if (messages.length > 0) {
        setTimeout(() => {
          messages.forEach((msg) => {
            chatRef.addMessage({
              role: msg.role === 'user' ? 'user' : 'ai',
              text: msg.text,
            })
          })
        }, 100)
      }
    }
  }

  function setupChat(ref: any, messages: Message[]) {
    if (!ref) return

    ref.connect = {
      handler: async (body: any, signals: any) => {
        try {
          const userMessage = body.messages[body.messages.length - 1]?.text || ''

          await window.electronAPI.addMessage(conversationId, {
            role: 'user',
            text: userMessage,
            timestamp: Date.now(),
          })

          const response = await window.electronAPI.sendChatMessage(conversationId, userMessage)

          await window.electronAPI.addMessage(conversationId, {
            role: 'ai',
            text: response,
            timestamp: Date.now(),
          })

          onConversationUpdate()

          signals.onResponse({ text: response })
        } catch (error) {
          signals.onResponse({ error: 'Erreur lors de la communication avec l\'IA.' })
        }
      },
    }

    ref.submitButtonStyles = {
      submit: {
        container: {
          default: { backgroundColor: 'unset' },
        },
        svg: {
          content:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        },
      },
    }

    if (messages.length > 0) {
      setTimeout(() => {
        messages.forEach((msg) => {
          ref.addMessage({
            role: msg.role === 'user' ? 'user' : 'ai',
            text: msg.text,
          })
        })
      }, 100)
    }
  }

  $: isDark = $theme === 'dark'
  $: chatStyle = isDark
    ? 'width: 100%; height: 100%; border: none; border-radius: 0; background-color: #030712;'
    : 'width: 100%; height: 100%; border: none; border-radius: 0; background-color: #f9fafb;'
  $: bubbleColors = isDark
    ? { user: { backgroundColor: '#7c3aed', color: '#fff' }, ai: { backgroundColor: '#1f2937', color: '#fff' } }
    : { user: { backgroundColor: '#7c3aed', color: '#fff' }, ai: { backgroundColor: '#e5e7eb', color: '#111827' } }
  $: messageStylesJson = JSON.stringify({
    default: {
      shared: { bubble: bubbleColors.ai },
      user: { bubble: bubbleColors.user },
      ai: { bubble: bubbleColors.ai },
    },
  })

  // Se ré-exécute à chaque fois que chatRef change : au premier montage,
  // ET après chaque recréation de <deep-chat> par le bloc {#key isDark}.
  $: setupChat(chatRef, initialMessages)
</script>

<div class="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
  {#key isDark}
    <deep-chat
      bind:this={chatRef}
      style={chatStyle}
      textInput='{{"placeholder": {"text": "Posez une question sur vos documents..."}}}'
      messageStyles={messageStylesJson}
    ></deep-chat>
  {/key}
</div>