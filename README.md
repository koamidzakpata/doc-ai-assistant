# Doc AI Assistant

Assistant IA de bureau permettant de discuter avec ses propres documents (PDF, DOCX, TXT) grâce à une architecture RAG (Retrieval-Augmented Generation) locale, construit avec Electron, Svelte et l'API Groq.


## Fonctionnalités

- **Chat IA conversationnel** avec mémoire d'historique (via Groq / Llama 3.3 70B)
- **Upload de documents** (PDF, DOCX, TXT) avec extraction de texte automatique
- **RAG (Retrieval-Augmented Generation)** : recherche de contenu pertinent dans les documents pour enrichir les réponses de l'IA
- **Documents isolés par conversation** : chaque conversation garde ses propres documents
- **Persistance locale** : conversations et documents sauvegardés sur la machine (via `electron-store`), aucune base de données externe
- **Thème clair / sombre** avec mémorisation du choix
- **Sécurité renforcée** : Content Security Policy stricte, aucune ressource externe non essentielle chargée (conformément aux standards de confidentialité du projet)
- **Génération de documents exportables** : sur demande explicite ("résumé en PDF", "exporte en DOCX"...), l'IA génère une synthèse détaillée des documents de la conversation, affichée dans un panneau d'aperçu latéral avec téléchargement en PDF, DOCX ou TXT

## Export de documents générés par l'IA

En plus de répondre aux questions sur vos documents, l'assistant peut générer de nouveaux documents à la demande :

- **Résumés/synthèses** : "Fais-moi un résumé de tous les documents en PDF"
- **Conversion de format** : "Convertis ce résumé en DOCX"

Le document généré s'affiche dans un panneau d'aperçu à droite du chat, avec un bouton **Télécharger** qui ouvre une boîte de dialogue pour choisir l'emplacement d'enregistrement.

> Note : cette fonctionnalité utilise le *tool calling* de Groq, l'IA ne déclenche la génération que sur demande explicite (mots-clés comme "pdf", "docx", "txt", "exporte", "génère"...), jamais pendant une conversation normale sur vos documents.

## Stack technique

- **Frontend** : Svelte 5 + TypeScript + Vite
- **Style** : Tailwind CSS v4 + UnoCSS
- **Desktop** : Electron
- **IA** : Groq API (Llama 3.3 70B Versatile)
- **Interface de chat** : [Deep Chat](https://deepchat.dev/) (Web Component)
- **Parsing de documents** : `pdf-parse`, `mammoth`
- **Persistance** : `electron-store`

## Architecture

doc-ai-assistant/
├── electron/ # Processus principal Electron
│   ├── main.ts # Point d'entrée, fenêtre, sécurité (CSP)
│   ├── preload.ts # Pont sécurisé (contextBridge)
│   ├── ipc/ # Handlers de communication IPC
│   └── services/ # Logique métier (Groq, RAG, parsing, conversations)
├── src/ # Frontend Svelte
│   ├── App.svelte
│   └── lib/
│       ├── components/ # Sidebar, Header, ChatWindow
│       ├── stores/ # Store de thème (dark/light)
│       └── types/ # Types partagés

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- Une clé API [Groq](https://console.groq.com/) (gratuite)

## Installation

```bash
# Cloner le dépôt
git clone <url-du-repo>
cd doc-ai-assistant

# Installer les dépendances
npm install
```

> **Comment obtenir une clé API Groq (gratuite) :**
> 1. Créez un compte sur [console.groq.com](https://console.groq.com/)
> 2. Allez dans **API Keys** → **Create API Key**
> 3. Copiez la clé générée
>
> Aucune configuration manuelle de fichier n'est nécessaire : au premier lancement de l'application, un écran dédié vous demandera de coller votre clé API. Elle est stockée localement sur votre machine (via `electron-store`) et n'est jamais partagée ni versionnée dans le dépôt Git.

## Lancer en développement

```bash
npm run dev:all
```

Cette commande lance simultanément le serveur Vite (frontend) et l'application Electron.

## Scripts disponibles

| Commande | Description |
|---|---|
| `npm run dev:all` | Lance le frontend et Electron ensemble (mode développement) |
| `npm run build` | Build de production du frontend |
| `npm run electron:compile` | Compile le code TypeScript d'Electron |
| `npm run check` | Vérification des types TypeScript / Svelte |
| `npm run dist` | Build complet + génération de l'installeur Windows (.exe) |

## Build de production (packaging)

\`\`\`bash
npm run dist
\`\`\`

Cette commande enchaîne automatiquement :
1. `vite build` — build du frontend
2. Compilation TypeScript du code Electron (processus principal + preload)
3. `electron-builder` — génération de l'installeur Windows (NSIS)

L'installeur (`Doc AI Assistant Setup 0.0.0.exe`) est généré dans le dossier `release/`.

> **Note sur la compatibilité OS :** Le build actuel (`npm run dist`) génère uniquement un installeur **Windows** (`.exe` via NSIS), car electron-builder ne peut pas cross-compiler vers macOS/Linux depuis une machine Windows. Si vous êtes sur Mac ou Linux, clonez le dépôt et lancez `npm run dist` directement sur votre machine pour générer l'installeur correspondant à votre OS (nécessite d'ajouter les cibles `mac`/`linux` dans la config `build` du `package.json`).

## Sécurité

L'application applique une Content Security Policy (CSP) stricte au niveau du processus principal Electron : seules les connexions vers l'API Groq sont autorisées, et aucune ressource externe (police, script tiers, etc.) n'est chargée sans nécessité, afin de préserver la confidentialité des documents de l'utilisateur.

## Démonstration vidéo

Une courte vidéo de démonstration de l'application est disponible ici :

🎥 [Voir la démonstration](https://drive.google.com/file/d/1ycOFAHHj2wbwdCYuvqUqQ_mL9ZCLrMLl/view?usp=sharing)

La vidéo présente :
- La création d'une nouvelle conversation
- L'ajout et l'analyse d'un document (PDF/DOCX/TXT)
- Une question basée sur le contenu du document (RAG)
- Une question de suivi montrant la mémoire de contexte
- La navigation entre les conversations et leurs documents respectifs
- Le changement de thème clair/sombre

## Auteur

DZAKPATA Koami Junior