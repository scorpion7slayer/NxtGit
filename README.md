# NxtGit

A desktop Git client with AI built in. Browse repos, review code, chat with AI, edit files, and push — all from one app.

[![Watch the demo](https://img.youtube.com/vi/W2mVp_yVHcA/maxresdefault.jpg)](https://youtu.be/W2mVp_yVHcA)

## Why NxtGit?

I got tired of switching between GitHub, my editor, and ChatGPT while working on projects. NxtGit puts everything in one window: your repos, issues, PRs, an AI chat that understands your code, and a file editor that commits straight to GitHub.

It runs natively on macOS, Windows, and Linux thanks to Tauri (Rust backend, React frontend).

## What you can do

- **Browse everything** — repos, files, issues, PRs, commits, releases, workflow runs, contributor profiles
- **Chat with AI** — attach files or whole repos for context, stream responses in real-time, see the model's thinking process
- **Review code** — paste a snippet, get an instant AI review with bug/security/perf suggestions
- **Edit & commit** — open any file, edit it in-app, write a commit message, push. No terminal
- **Preview files** — rendered markdown, inline images, GitHub Pages preview for HTML
- **Search GitHub** — find repos and users from the search page
- **Stay updated** — GitHub status page, notifications, app changelog, auto-updates

## AI providers

NxtGit works with 8 providers. Pick whichever you already use:

| Provider | How it connects | Thinking support |
| --- | --- | --- |
| GitHub Copilot | OAuth (free if you have Copilot) | o-series reasoning |
| OpenRouter | API key | All reasoning models |
| Anthropic | API key | Extended thinking |
| OpenAI | API key | o1/o3/o4 reasoning |
| Ollama | Local, no key needed | Any model |
| Moonshot | API key | — |
| Kilocode | API key | — |
| MiniMax | API key | — |

Keys are stored locally on your machine via your OS secure storage. Nothing leaves your device except API calls.

## Get it

Download from the [Releases page](https://github.com/scorpion7slayer/NxtGit/releases).

| Platform | What's available |
| --- | --- |
| macOS | `.dmg` (Apple Silicon + Intel) |
| Windows | `.msi` / `.exe` (x64, x86, ARM64) |
| Linux | `.deb` / `.AppImage` (x64, ARM64) |

## Getting started

1. Install and open NxtGit
2. Click **Sign in with GitHub** — a device code flow opens in your browser
3. After login, a quick walkthrough shows you around the app
4. Head to **Settings** to add AI provider keys if you want to use the chat/review features

That's it. Your repos load automatically.

## Build from source

You need Node.js 18+, Rust 1.77.2+, and the Tauri CLI.

```bash
git clone https://github.com/scorpion7slayer/NxtGit.git
cd NxtGit
npm install
npm run tauri-dev    # dev mode
npm run tauri-build  # production build
```

Set `VITE_GITHUB_CLIENT_ID` in a `.env` file for GitHub OAuth (create an OAuth App with Device Flow enabled in [GitHub Developer Settings](https://github.com/settings/developers)).

## Tech stack

| | |
| --- | --- |
| Frontend | React 18, TypeScript, Tailwind CSS, Vite |
| Backend | Rust via Tauri v2 |
| State | Zustand + Tauri Store (persisted) |
| AI | Direct SSE/NDJSON streaming via ReadableStream |
| Design | Liquid Glass on macOS Tahoe 26+, solid fallbacks elsewhere |

## Project structure

```
src/                    React frontend
  components/           All UI components
  stores/               Zustand stores (auth, etc.)
  lib/
    ai.ts               AI providers, streaming, thinking
    github.ts           GitHub API (repos, PRs, issues, file CRUD)
src-tauri/              Rust backend (Tauri v2)
  src/lib.rs            Plugin setup + macOS platform detection
  tauri.conf.json       Window config, CSP, updater
.github/workflows/      CI/CD (build, test, lint, release)
```

## Recent changes

**v1.1.0** — Onboarding tour, Help & Feedback page, AI thinking mode, repo filters, animations, smarter search

**v1.0.9** — PR view refreshes after merge, clearer merge error messages

**v1.0.8** — Keyboard shortcuts, offline caching, GitHub Pages preview flow

See the full history in the [Releases page](https://github.com/scorpion7slayer/NxtGit/releases) or in-app via Changelog.

## Contributing

1. Fork it
2. Create a branch (`git checkout -b my-feature`)
3. Commit and push
4. Open a PR

## License

MIT — see [LICENSE](LICENSE)

---

Built by [@scorpion7slayer](https://github.com/scorpion7slayer)
