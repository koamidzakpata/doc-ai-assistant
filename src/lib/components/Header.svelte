<script lang="ts">
  export let conversationTitle: string = 'Nouvelle conversation'
  export let isConnected: boolean = false
</script>

<header class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
  <span class="text-sm font-medium text-gray-900 dark:text-white">{conversationTitle}</span>
  <span class="flex items-center gap-2 text-xs">
    <span
      class="w-2 h-2 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'}"
    ></span>
    <span class="text-gray-500 dark:text-gray-400">
      {isConnected ? 'Groq connecté' : 'Déconnecté'}
    </span>
  </span>
</header>