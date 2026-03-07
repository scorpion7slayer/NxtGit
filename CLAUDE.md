# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NxtGit is an AI-native Git client for macOS and Windows built with Tauri v2 (Rust backend + React/TypeScript frontend). It features a "Liquid Glass" UI design language on macOS (native vibrancy + transparent window + backdrop-filter) with solid fallbacks on Windows. Includes GitHub OAuth integration and AI-powered code review/PR description generation via OpenRouter.

## Build & Development Commands

```bash
npm install              # Install frontend dependencies
npm run dev              # Start Vite dev server only (no Tauri shell)
npm run tauri-dev        # Full dev mode: Vite + Tauri Rust backend
npm run tauri-build      # Production build (outputs .dmg for macOS)
npm run build            # Frontend-only build: tsc + vite build
```

Rust backend requires `cargo` and the Rust toolchain (edition 2021, rust-version 1.70+). Tauri CLI is installed via npm (`@tauri-apps/cli` v2).

No test runner or linter is currently configured.

## Architecture

### Frontend (`src/`)
- **React 18 + TypeScript + Tailwind CSS 3**, bundled with Vite 5
- Path alias: `@` maps to `./src` (configured in `vite.config.ts`)
- Routing: `react-router-dom` v6 with `BrowserRouter` in `main.tsx`, routes defined in `App.tsx`
- State management: **Zustand** stores in `src/stores/` — `authStore.ts` handles auth state persisted via `@tauri-apps/plugin-store`
- Icons: `lucide-react`
- All components are in `src/components/` as single-file React functional components with co-located sub-components (no separate files for small pieces like `StatCard`, `PRCard`, etc.)

### Backend (`src-tauri/`)
- **Tauri v2** with minimal Rust code — `main.rs` only registers plugins (shell, http, store). No custom Tauri commands yet.
- Plugins: `tauri-plugin-shell`, `tauri-plugin-http`, `tauri-plugin-store`
- Config in `tauri.conf.json`: dev server at `localhost:1420`, transparent window with overlay title bar, CSP restricted to GitHub API and OpenRouter API domains

### Design System
- "Liquid Glass" on macOS: native `sidebar` vibrancy effect via Tauri `windowEffects`, transparent window, overlay title bar, `backdrop-filter: blur()` on cards/panels
- Platform detection via `html.platform-macos` class (set in `main.tsx` from user agent). All macOS-specific glass CSS is scoped under this class.
- On Windows/other: solid opaque backgrounds, standard title bar, no backdrop-filter
- Light/dark mode via `prefers-color-scheme` media query — variables switch automatically
- Key layout classes: `.layout-root`, `.layout-sidebar`, `.layout-main`, `.sidebar-header` (drag region on macOS)
- Key CSS classes: `.btn-primary`, `.btn-secondary`, `.input-glass`, `.nav-item`, `.login-card`, `.login-page`
- Cards use `.border.rounded-lg` / `.border.rounded-xl` pattern — these automatically get glass effect on macOS
- Colors follow Apple HIG conventions: `--accent: #007AFF`, `--success: #34C759`, `--warning: #FF9500`, `--error: #FF3B30`
- When adding UI, use CSS variables (`var(--text-primary)`, `var(--bg-tertiary)`, etc.) instead of hardcoded colors

### External APIs
- **GitHub**: OAuth flow initiated client-side (`Login.tsx`), uses `@octokit/rest` and `octokit` for API calls. Scopes: `repo read:user read:org`
- **OpenRouter**: AI features (code review, PR description generation) use the OpenRouter API. Key stored locally via Tauri store.

### Environment Variables
- `VITE_GITHUB_CLIENT_ID` — GitHub OAuth client ID
- `VITE_OPENROUTER_API_KEY` — OpenRouter API key (optional, can be set in-app)

## Current State

The app has UI scaffolding with mostly static/placeholder data. Dashboard stats, repository list, PR list, and AI review results are all hardcoded. The GitHub OAuth flow opens a browser window but the callback handler is not implemented. AI review triggers a timeout mock, not actual API calls. Core functionality (fetching real data from GitHub, calling OpenRouter, handling OAuth callbacks) still needs to be built.
