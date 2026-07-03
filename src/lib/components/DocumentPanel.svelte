<script lang="ts">
  export let isOpen: boolean = false
  export let onClose: () => void = () => {}
  export let onFilesSelected: (files: FileList) => void = () => {}

  let fileInput: HTMLInputElement

  function handleChange(e: Event) {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      onFilesSelected(target.files)
      onClose()
    }
  }

  function triggerFileSelect() {
    fileInput.click()
  }

  function handleOverlayKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
    role="button"
    tabindex="0"
    aria-label="Fermer la fenêtre"
    on:click={onClose}
    on:keydown={handleOverlayKeydown}
  >
    <div
      class="bg-gray-900 border border-gray-700 rounded-lg p-6 w-96"
      role="dialog"
      aria-modal="true"
      aria-labelledby="document-panel-title"
      tabindex="-1"
      on:click|stopPropagation
      on:keydown|stopPropagation
    >
      <h2 id="document-panel-title" class="text-white text-lg font-medium mb-2">
        Ajouter un document
      </h2>
      <p class="text-gray-400 text-sm mb-4">
        Formats acceptés : PDF, TXT, DOCX
      </p>

      <button
        type="button"
        tabindex="0"
        class="w-full border-2 border-dashed border-gray-700 rounded-lg py-8 text-gray-400 hover:border-purple-500 hover:text-purple-400 transition-colors"
        on:click={triggerFileSelect}
      >
        Cliquez pour choisir un fichier
      </button>

      <input
        type="file"
        accept=".pdf,.txt,.docx"
        bind:this={fileInput}
        on:change={handleChange}
        class="hidden"
      />

      <button
        type="button"
        class="mt-4 text-sm text-gray-500 hover:text-gray-300"
        on:click={onClose}
      >
        Annuler
      </button>
    </div>
  </div>
{/if}