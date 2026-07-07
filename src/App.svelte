<script lang="ts">
  import { onMount } from 'svelte'
  import Sidebar from './lib/components/Sidebar.svelte'
  import Header from './lib/components/Header.svelte'
  import ChatWindow from './lib/components/ChatWindow.svelte'
  import ApiKeySetup from './lib/components/ApiKeySetup.svelte'
  import type { Conversation } from './lib/types/index.js'
  import { theme } from './lib/stores/theme.js'

  let conversations: Conversation[] = []
  let activeConversation: Conversation | null = null
  let isConnected = false
  let chatWindow: ChatWindow
  let apiKeyReady = false
  let checkingApiKey = true

  onMount(async () => {
    theme.init()

    apiKeyReady = await window.electronAPI.hasApiKey()
    checkingApiKey = false

    if (apiKeyReady) {
      await loadApp()
    }
  })

  async function loadApp() {
    isConnected = await window.electronAPI.getChatStatus()

    conversations = await window.electronAPI.listConversations()

    if (conversations.length === 0) {
      activeConversation = await window.electronAPI.createConversation()
      conversations = [activeConversation]
    } else {
      activeConversation = conversations[0]
    }
  }

  async function handleKeySaved() {
    apiKeyReady = true
    await loadApp()
  }

  async function refreshConversations() {
    conversations = await window.electronAPI.listConversations()
    if (activeConversation) {
      const updated = conversations.find((c) => c.id === activeConversation!.id)
      if (updated) activeConversation = updated
    }
  }

  async function handleNewConversation() {
    const newConv = await window.electronAPI.createConversation()
    conversations = [newConv, ...conversations]
    activeConversation = newConv
    chatWindow.reset([])
  }

  async function handleSelectConversation(id: string) {
    const conv = conversations.find((c) => c.id === id)
    if (!conv || conv.id === activeConversation?.id) return
    activeConversation = conv
    chatWindow.reset(conv.messages)
  }

  async function handleDeleteConversation(id: string) {
    await window.electronAPI.deleteConversation(id)
    conversations = conversations.filter((c) => c.id !== id)

    if (activeConversation?.id === id) {
      if (conversations.length === 0) {
        activeConversation = await window.electronAPI.createConversation()
        conversations = [activeConversation]
      } else {
        activeConversation = conversations[0]
      }
      chatWindow.reset(activeConversation.messages)
    }
  }

  async function handleAddDocument() {
    if (!activeConversation) return
    const selected = await window.electronAPI.selectDocuments(activeConversation.id)
    if (selected.length > 0) {
      await refreshConversations()
    }
  }

  async function handleRemoveDocument(fileName: string) {
    if (!activeConversation) return
    await window.electronAPI.removeDocument(activeConversation.id, fileName)
    await refreshConversations()
  }

  async function handleConversationUpdate() {
    await refreshConversations()
  }

  $: sidebarConversations = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    active: c.id === activeConversation?.id,
  }))

  $: sidebarDocuments = (activeConversation?.documents ?? []).map((d) => ({
    id: d.fileName,
    name: d.fileName,
  }))

  $: conversationTitle = activeConversation?.title ?? 'Nouvelle conversation'
</script>

{#if checkingApiKey}
  <div class="flex h-screen w-screen items-center justify-center bg-gray-50 dark:bg-gray-950" />
{:else if !apiKeyReady}
  <ApiKeySetup onKeySaved={handleKeySaved} />
{:else}
  <div class="flex h-screen w-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white overflow-hidden">
    <Sidebar
      documents={sidebarDocuments}
      conversations={sidebarConversations}
      onAddDocument={handleAddDocument}
      onRemoveDocument={handleRemoveDocument}
      onNewConversation={handleNewConversation}
      onSelectConversation={handleSelectConversation}
      onDeleteConversation={handleDeleteConversation}
    />

    <div class="flex-1 flex flex-col">
      <Header {conversationTitle} {isConnected} />
      {#if activeConversation}
        <ChatWindow
          bind:this={chatWindow}
          conversationId={activeConversation.id}
          initialMessages={activeConversation.messages}
          onConversationUpdate={handleConversationUpdate}
        />
      {/if}
    </div>
  </div>
{/if}