import { mount } from 'svelte'
import 'virtual:uno.css'
import './app.css'
import 'deep-chat'
import App from './App.svelte'

// Empêche Deep Chat de charger la police Google Fonts (Inter) avant même
// que le navigateur ne tente la requête, pour éviter tout message de blocage CSP visible.
const originalAppendChild = Node.prototype.appendChild
Node.prototype.appendChild = function <T extends Node>(node: T): T {
  if (
    node instanceof HTMLLinkElement &&
    node.href &&
    node.href.includes('fonts.googleapis.com')
  ) {
    return node
  }
  return originalAppendChild.call(this, node) as T
}

const originalInsertBefore = Node.prototype.insertBefore
Node.prototype.insertBefore = function <T extends Node>(node: T, child: Node | null): T {
  if (
    node instanceof HTMLLinkElement &&
    node.href &&
    node.href.includes('fonts.googleapis.com')
  ) {
    return node
  }
  return originalInsertBefore.call(this, node, child) as T
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app