import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  base: './',
  plugins: [UnoCSS(), svelte(), tailwindcss()],
})