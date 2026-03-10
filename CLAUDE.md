# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NxtGit is an AI-native Git client for macOS and Windows built with Tauri v2 (Rust backend + React/TypeScript frontend). It features a "Liquid Glass" UI design language on macOS Tahoe 26+ with standard macOS fallbacks on older releases and solid fallbacks on Windows. Includes GitHub OAuth integration, an in-app updater, and AI-powered code review/PR description generation via OpenRouter.

## Build & Development Commands

```bash
npm install              # Install frontend dependencies
npm run dev              # Start Vite dev server only (no Tauri shell)
npm run tauri-dev        # Full dev mode: Vite + Tauri Rust backend
npm run tauri-build      # Production build (outputs .dmg for macOS)
npm run build            # Frontend-only build: tsc + vite build
```

Rust backend requires `cargo` and the Rust toolchain (edition 2021, rust-version 1.77.2+). Tauri CLI is installed via npm (`@tauri-apps/cli` v2).

No local test runner or linter is configured. CI/CD via GitHub Actions (`.github/workflows/`): `test.yml` runs `cargo test`, `lint.yml` runs `tsc` type checking, `build.yml` and `release.yml` handle builds and releases.

## Architecture

### Frontend (`src/`)
- **React 18 + TypeScript + Tailwind CSS 3**, bundled with Vite 5
- Path alias: `@` maps to `./src` (configured in `vite.config.ts`)
- Routing: `react-router-dom` v6 with `BrowserRouter` in `main.tsx`, routes defined in `App.tsx`
- State management: **Zustand** stores in `src/stores/` — `authStore.ts` handles auth state persisted via `@tauri-apps/plugin-store`
- Icons: `lucide-react`
- All components are in `src/components/` as single-file React functional components with co-located sub-components (no separate files for small pieces like `StatCard`, `PRCard`, etc.)

### Backend (`src-tauri/`)
- **Tauri v2** with minimal Rust code — `main.rs` only registers plugins. `lib.rs` now also exposes platform info for the frontend and applies native vibrancy only on macOS Tahoe 26+.
- Plugins: `tauri-plugin-shell`, `tauri-plugin-http`, `tauri-plugin-store`, `tauri-plugin-window-state`, `tauri-plugin-clipboard-manager`, `tauri-plugin-updater`, `tauri-plugin-process`
- Config in `tauri.conf.json`: dev server at `localhost:1420`, transparent window with overlay title bar, updater endpoint on GitHub Releases, CSP restricted to GitHub API and OpenRouter API domains

### Business Logic (`src/lib/`)
- **`ai.ts`** — Multi-provider AI integration with streaming support. Providers: GitHub Copilot (OAuth device flow), OpenRouter, Anthropic, OpenAI, Ollama (local), Moonshot, Kilocode, Minimax. Handles token management, model selection, and streaming responses.
- **`github.ts`** — GitHub API wrapper using `@octokit/rest`. Repos, PRs, issues, commits, workflow runs, user profiles, org data.

### Design System
- "Liquid Glass" is enabled only on macOS Tahoe 26+ via native vibrancy plus the `html.platform-macos-tahoe` class
- `html.platform-macos` still exists for generic macOS behavior like drag regions and title bar spacing
- On older macOS versions and Windows/other: solid opaque backgrounds, standard title bar behavior, no Liquid Glass blur stack
- Light/dark mode via `prefers-color-scheme` media query — variables switch automatically
- Key layout classes: `.layout-root`, `.layout-sidebar`, `.layout-main`, `.sidebar-header` (drag region on macOS)
- Key CSS classes: `.btn-primary`, `.btn-secondary`, `.input-glass`, `.nav-item`, `.login-card`, `.login-page`
- Cards use `.border.rounded-lg` / `.border.rounded-xl` pattern — these automatically get glass effect on macOS Tahoe 26+
- Colors follow Apple HIG conventions: `--accent: #007AFF`, `--success: #34C759`, `--warning: #FF9500`, `--error: #FF3B30`
- When adding UI, use CSS variables (`var(--text-primary)`, `var(--bg-tertiary)`, etc.) instead of hardcoded colors

### External APIs
- **GitHub**: OAuth device flow implemented in `Login.tsx` with token polling, uses `@octokit/rest` for API calls. Scopes: `repo read:user read:org`
- **AI Providers**: Multiple providers supported via `src/lib/ai.ts`:
  - **GitHub Copilot** — OAuth device flow, token caching with expiry, models: gpt-4.1, o3-mini, claude-sonnet-4, etc.
  - **OpenRouter** — API key auth, wide model selection
  - **Anthropic / OpenAI** — Direct API key auth
  - **Ollama** — Local LLM support with custom base URL
  - Keys stored locally via Tauri store

### Environment Variables
- `VITE_GITHUB_CLIENT_ID` — GitHub OAuth client ID
- `VITE_OPENROUTER_API_KEY` — OpenRouter API key (optional, can be set in-app)

## Current State

Version 1.0.5 prepared. Core features implemented: GitHub OAuth device flow with token polling, real GitHub API integration (repos, PRs, issues, commits, workflow runs, user profiles), multi-provider AI with streaming (Copilot, OpenRouter, Anthropic, OpenAI, Ollama), AI-powered chat and code review, GitHub status monitoring, global search, app changelog from GitHub releases, macOS drag fixes, in-app update notification/install flow, GitHub changelog media support, HTML preview fixes, hotfix update detection, and Liquid Glass limited to macOS Tahoe 26+. 20+ components in `src/components/`.
