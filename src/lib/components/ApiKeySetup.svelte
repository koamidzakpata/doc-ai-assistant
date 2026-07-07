<script lang="ts">
  export let onKeySaved: () => void

  let apiKey = ''
  let error = ''
  let saving = false

  async function handleSubmit() {
    error = ''
    const trimmed = apiKey.trim()

    if (!trimmed) {
      error = 'Merci d\'entrer une clé API.'
      return
    }

    saving = true
    try {
      await window.electronAPI.setApiKey(trimmed)
      onKeySaved()
    } catch (e) {
      error = 'Erreur lors de l\'enregistrement de la clé.'
    } finally {
      saving = false
    }
  }
</script>

<div class="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
  <div class="w-full max-w-md p-8 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
    <h1 class="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Configuration requise</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
      Entrez votre clé API Groq pour utiliser Doc AI Assistant. Vous pouvez en obtenir une gratuitement sur
      <a href="https://console.groq.com/keys" target="_blank" class="underline">console.groq.com</a>.
    </p>

    <input
      type="password"
      bind:value={apiKey}
      placeholder="gsk_..."
      class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-3"
      on:keydown={(e) => e.key === 'Enter' && handleSubmit()}
    />

    {#if error}
      <p class="text-sm text-red-500 mb-3">{error}</p>
    {/if}

    <button
      on:click={handleSubmit}
      disabled={saving}
      class="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
    >
      {saving ? 'Enregistrement...' : 'Valider'}
    </button>
  </div>
</div>