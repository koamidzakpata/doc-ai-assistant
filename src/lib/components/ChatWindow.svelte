<script lang="ts">
  import type { Message } from "../types/index.js";
  import { theme } from "../stores/theme.js";

  export const onMessageSend: (message: string) => Promise<string> = async () =>
    "";
  export let conversationId: string = "";
  export let initialMessages: Message[] = [];
  export let onConversationUpdate: () => void = () => {};
  export let onDocumentGenerated: (doc: {
    format: "pdf" | "docx" | "txt";
    filename: string;
    content: string;
  }) => void = () => {};

  let chatRef: any;

  export function reset(messages: Message[] = []) {
    if (chatRef) {
      chatRef.clearMessages();
      if (messages.length > 0) {
        setTimeout(() => {
          messages.forEach((msg) => {
            chatRef.addMessage({
              role: msg.role === "user" ? "user" : "ai",
              text: msg.text,
            });
          });
        }, 100);
      }
    }
  }

  function setupChat(ref: any, messages: Message[]) {
    if (!ref) return;

    ref.stream = true;

    ref.connect = {
      handler: async (body: any, signals: any) => {
        let fullText = "";
        let unsubscribeChunk = (): void => {};
        let unsubscribeDone = (): void => {};

        try {
          const userMessage =
            body.messages[body.messages.length - 1]?.text || "";

          await window.electronAPI.addMessage(conversationId, {
            role: "user",
            text: userMessage,
            timestamp: Date.now(),
          });

          unsubscribeChunk = window.electronAPI.onChatChunk((chunk: string) => {
            fullText += chunk;
            signals.onResponse({ text: chunk });
          });

          const donePromise = new Promise<void>((resolve) => {
            unsubscribeDone = window.electronAPI.onChatDone(() => {
              resolve();
            });
          });

          const result = await window.electronAPI.sendChatMessage(
            conversationId,
            userMessage
          );
          await donePromise;

          if (result.type === "document") {
            // Aucun chunk de texte n'a été streamé pour un document (le modèle a
            // appelé l'outil create_document au lieu de répondre en texte) :
            // on affiche un message de confirmation dans le chat, et on ouvre
            // le panneau d'aperçu via le callback remonté au parent.
            const confirmationText = `📄 Document généré : ${result.filename}.${result.format} — voir l'aperçu à droite.`;
            signals.onResponse({ text: confirmationText });
            signals.onClose();

            await window.electronAPI.addMessage(conversationId, {
              role: "ai",
              text: confirmationText,
              timestamp: Date.now(),
            });

            onDocumentGenerated({
              format: result.format,
              filename: result.filename,
              content: result.content,
            });
          } else {
            const finalText = result.text || fullText || "Erreur : réponse vide.";

            if (!fullText) {
              // Aucun chunk n'a été streamé (ex: l'appel d'outil a échoué côté
              // serveur avant tout streaming) : on affiche quand même le message
              // à l'utilisateur, au lieu de le laisser sans réponse visible.
              signals.onResponse({ text: finalText });
            }
            signals.onClose();

            await window.electronAPI.addMessage(conversationId, {
              role: "ai",
              text: finalText,
              timestamp: Date.now(),
            });
          }

          onConversationUpdate();
        } catch (error) {
          signals.onResponse({
            error: "Erreur lors de la communication avec l'IA.",
          });
        } finally {
          unsubscribeChunk();
          unsubscribeDone();
        }
      },
    };

    ref.submitButtonStyles = {
      submit: {
        container: {
          default: { backgroundColor: "unset" },
        },
        svg: {
          content:
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        },
      },
    };

    if (messages.length > 0) {
      setTimeout(() => {
        messages.forEach((msg) => {
          ref.addMessage({
            role: msg.role === "user" ? "user" : "ai",
            text: msg.text,
          });
        });
      }, 100);
    }
  }

  $: isDark = $theme === "dark";
  $: chatStyle = isDark
    ? "width: 100%; height: 100%; border: none; border-radius: 0; background-color: #030712;"
    : "width: 100%; height: 100%; border: none; border-radius: 0; background-color: #f9fafb;";
  $: bubbleColors = isDark
    ? {
        user: { backgroundColor: "#7c3aed", color: "#fff" },
        ai: { backgroundColor: "#1f2937", color: "#fff" },
      }
    : {
        user: { backgroundColor: "#7c3aed", color: "#fff" },
        ai: { backgroundColor: "#e5e7eb", color: "#111827" },
      };
  $: messageStylesJson = JSON.stringify({
    default: {
      shared: { bubble: bubbleColors.ai },
      user: { bubble: bubbleColors.user },
      ai: { bubble: bubbleColors.ai },
    },
  });

  let lastSetupRef: any = null;

  $: if (chatRef && chatRef !== lastSetupRef) {
    lastSetupRef = chatRef;
    setupChat(chatRef, initialMessages);
  }
</script>

<div class="flex-1 flex flex-col h-full min-h-0 overflow-hidden">
  {#key isDark}
    <deep-chat
      bind:this={chatRef}
      style={chatStyle}
      textInput={{
        placeholder: { text: "Posez une question sur vos documents..." },
      }}
      messageStyles={messageStylesJson}
    ></deep-chat>
  {/key}
</div>