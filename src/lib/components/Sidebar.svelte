<script lang="ts">
  import { theme } from '../stores/theme.js'

  export let documents: { id: string; name: string }[] = []
  export let conversations: { id: string; title: string; active: boolean }[] = []
  export let onAddDocument: () => void = () => {}
  export let onRemoveDocument: (fileName: string) => void = () => {}
  export let onNewConversation: () => void = () => {}
  export let onSelectConversation: (id: string) => void = () => {}
  export let onDeleteConversation: (id: string) => void = () => {}
</script>

<aside class="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
  <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
    <span class="text-sm font-semibold text-gray-900 dark:text-white">Doc AI Assistant</span>
    <button
      type="button"
      class="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-800"
      on:click={theme.toggle}
      aria-label="Changer de thème"
    >
      {#if $theme === 'dark'}
        ☀️
      {:else}
        🌙
      {/if}
    </button>
  </div>

  <div class="px-4 pt-4 pb-1 text-xs text-gray-500 uppercase tracking-wide">
    Documents
  </div>
  <div class="px-2 flex flex-col gap-1 max-h-40 overflow-y-auto">
    {#each documents as doc (doc.id)}
      <div class="group flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
        <span class="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 truncate">
          📄 {doc.name}
        </span>
        <button
          type="button"
          tabindex="0"
          class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs px-1 transition-opacity"
          on:click={() => onRemoveDocument(doc.name)}
          aria-label="Supprimer {doc.name}"
        >
          ✕
        </button>
      </div>
    {/each}
    {#if documents.length === 0}
      <span class="text-xs text-gray-500 dark:text-gray-600 px-2 py-1">Aucun document dans cette conversation</span>
    {/if}
    <button
      type="button"
      class="text-left text-xs text-purple-500 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded px-2 py-1.5 mt-1"
      on:click={onAddDocument}
    >
      + Ajouter un document
    </button>
  </div>

  <div class="px-4 pt-5 pb-1 text-xs text-gray-500 uppercase tracking-wide flex items-center justify-between">
    Conversations
    <button
      type="button"
      class="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300"
      on:click={onNewConversation}
      aria-label="Nouvelle conversation"
    >
      +
    </button>
  </div>
  <div class="px-2 flex flex-col gap-1 flex-1 overflow-y-auto">
    {#each conversations as conv (conv.id)}
      <div class="group flex items-center justify-between rounded hover:bg-gray-100 dark:hover:bg-gray-800">
        <button
          class="flex-1 text-left text-sm px-2 py-1.5 truncate {conv.active
            ? 'text-gray-900 dark:text-white'
            : 'text-gray-500 dark:text-gray-400'}"
          on:click={() => onSelectConversation(conv.id)}
        >
          {conv.title}
        </button>
        <button
          type="button"
          class="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 text-xs px-2 py-1.5 transition-opacity"
          on:click={() => onDeleteConversation(conv.id)}
          aria-label="Supprimer la conversation"
        >
          ✕
        </button>
      </div>
    {/each}
  </div>
</aside>