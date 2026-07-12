<script lang="ts">
  interface Props {
    format: 'pdf' | 'docx' | 'txt'
    filename: string
    content: string
    onClose: () => void
  }

  let { format, filename, content, onClose }: Props = $props()

  let downloadState = $state<'idle' | 'downloading' | 'success' | 'error' | 'canceled'>('idle')
  let savedPath = $state<string | null>(null)

  const formatLabels: Record<typeof format, string> = {
    pdf: 'PDF',
    docx: 'Word (DOCX)',
    txt: 'Texte (TXT)',
  }

  async function handleDownload() {
    downloadState = 'downloading'
    try {
      const result = await window.electronAPI.exportDocument(format, filename, content)
      if (result.success) {
        downloadState = 'success'
        savedPath = result.filePath
      } else {
        downloadState = 'canceled'
      }
    } catch (error) {
      console.error('Erreur export document:', error)
      downloadState = 'error'
    }
  }
</script>

<div class="flex h-full w-full flex-col border-l border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
  <div class="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
    <div class="flex items-center gap-2">
      <span class="rounded bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
        {formatLabels[format]}
      </span>
      <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{filename}.{format}</span>
    </div>
    <button
      onclick={onClose}
      class="rounded p-1 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
      aria-label="Fermer"
    >
      ✕
    </button>
  </div>

  <div class="flex-1 overflow-y-auto px-4 py-4">
    <pre class="whitespace-pre-wrap font-sans text-sm text-gray-800 dark:text-gray-200">{content}</pre>
  </div>

  <div class="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
    {#if downloadState === 'success'}
      <p class="mb-2 text-sm text-green-600 dark:text-green-400">
        ✓ Enregistré : {savedPath}
      </p>
    {:else if downloadState === 'canceled'}
      <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">Téléchargement annulé.</p>
    {:else if downloadState === 'error'}
      <p class="mb-2 text-sm text-red-600 dark:text-red-400">
        Erreur lors de la génération du fichier. Réessaie.
      </p>
    {/if}

    <button
      onclick={handleDownload}
      disabled={downloadState === 'downloading'}
      class="w-full rounded bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
    >
      {downloadState === 'downloading' ? 'Génération en cours...' : 'Télécharger'}
    </button>
  </div>
</div>