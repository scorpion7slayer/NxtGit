# Changelog

All notable changes to NxtGit are documented here.

## v1.1.0 — March 2026

The biggest update since launch. NxtGit now greets first-time users with a guided tour, ships a built-in Help & Feedback page, and adds polish across the board — from smoother animations to smarter search.

### New

- **Onboarding tour** — A step-by-step walkthrough highlights the sidebar, dashboard, repos, issues, PRs, chat and AI review the first time you open the app. You can replay it anytime from Settings.
- **Help & Feedback page** — Submit bug reports, feature requests, questions and general feedback without leaving the app. Your submissions open issues on the NxtGit GitHub repo with the right labels, and you can follow up on past conversations right from the same page.
- **Thinking mode for AI chat** — Toggle extended reasoning ("thinking") on compatible models. Pick between Low, Medium and High depth depending on how hard you want the model to think. Works with Anthropic, OpenRouter, OpenAI, Copilot and Ollama.
- **Repository filters** — Filter your repos by type (public, private, forks, archived, mirrors, templates), by language, and sort by last update, name or stars — just like on GitHub. A "Clear filters" button resets everything in one click.
- **Keyboard shortcut hints** — Hold Cmd (macOS) or Ctrl (Windows) and each sidebar item reveals its shortcut. Three new shortcuts added: AI Review, GitHub Status, and Help & Feedback.

### Improved

- **Instant local search** — Global search now filters your repos locally as you type, then enriches results from the GitHub API in the background. Feels much snappier.
- **Smoother animations** — Pages, cards, lists, dropdowns and suggestions now fade and slide in with staggered timing. All animations respect the "reduce motion" accessibility setting.
- **Liquid Glass dropdowns** — Dropdowns on macOS Tahoe get the same frosted-glass treatment as the rest of the UI.
- **Smarter back button in repos** — When browsing files in a repo, the back arrow navigates up one folder instead of jumping all the way back to the repo list.
- **Better OAuth flow** — The browser no longer opens automatically after copying the device code. A clear "Open GitHub to paste the code" button lets you go when you're ready, and the app window refocuses itself after login.
- **Animated refresh buttons** — The refresh icon in Notifications now spins while loading instead of just sitting there.
- **Full pagination for repos** — The repo list now fetches all your repositories (not just the first 50) using GitHub's pagination links.
- **External links in releases open in your browser** — Markdown links in release notes (like "Full Changelog") now open in your default browser instead of navigating inside the app.

### Fixed

- **Release links trapped in the app** — Clicking "Full Changelog" or any link inside a release body no longer hijacks the webview. Links open externally now.
- **Markdown links in file viewer** — Same fix applied to the file content viewer so README links behave correctly too.

---

## v1.0.9 — March 2026

Quick patch focused on the merge experience.

### Fixed

- Pull request status now refreshes immediately after a successful merge — no more stale "Open" badge.
- Stale cached PR data is cleared after merging so the sidebar and list stay in sync.

### Improved

- Merge failure messages are now human-readable. You'll see clear explanations for blocked methods, conflicts and branch protection rejections instead of raw API errors.

---

## v1.0.8 — March 2026

Big quality-of-life release: keyboard shortcuts, offline caching and a rethought HTML preview.

### New

- **Configurable keyboard shortcuts** — Remap every navigation shortcut from Settings.
- **Offline caching** — Repos, workflow runs, notifications and GitHub status are cached locally so the app still works when you're offline.
- **GitHub Pages flow** — Replaced the fragile in-app HTML preview with a proper GitHub Pages workflow: create, open, rebuild and disable — all from the file browser.

### Improved

- HTML preview now shows the exact URL before opening it.

---

## v1.0.8-fix — March 2026

Hardened release pipeline and security patch.

### Fixed

- Windows ARM64 now ships a native ARM64 MSI and NSIS installer.
- Release verification requires both .msi and .exe on Windows ARM64, and both .deb and .AppImage on Linux ARM64.
- Updated Rust lockfile to quinn-proto 0.11.14 to address a published security advisory.

---

## v1.0.7 — March 2026

Maintenance release, no user-facing changes. Internal release pipeline fixes.

---

## v1.0.6 — March 2026

Release pipeline improvements. Serialized release jobs so updater assets are always available and fixed fallback logic for the auto-updater.

### Fixed

- CodeQL DOM reinterpretation alert resolved.
- Updater release fallback for patch versions now works correctly.

---

## v1.0.5 — March 2026

### Fixed

- Builds on v1.0.4 can now detect and install v1.0.4-fix releases through the updater.

---

## v1.0.5-fix — March 2026

### New

- Optional interactive HTML preview mode that runs repository JavaScript inside a sandboxed iframe.

### Improved

- HTML preview now handles `@import`, inline style URLs, `srcset` and additional asset references.

---

## v1.0.4 — March 2026

### Improved

- Hardened HTML preview sanitization — repository JavaScript no longer runs inside the app.

---

## v1.0.4-fix — March 2026

### Fixed

- HTML preview works in packaged builds again (switched to a blob URL flow).
- Regional flags use native emoji on macOS and a built-in fallback on platforms with poor flag support.
- Stylesheet loading restored in the HTML preview after sanitization changes.

---

## v1.0.3 — March 2026

### Fixed

- HTML preview now renders linked CSS, JavaScript and relative assets correctly.
- Regional flags display properly on platforms without native flag emoji support (including Windows).

---

## v1.0.2 — March 2026

### Fixed

- GitHub Changelog videos and embeds now play in the app WebView.
- Login screen no longer flashes before a saved session is restored.

### Improved

- App version metadata is consistent across updater, settings and API requests.

---

## v1.0.1 — March 2026

### New

- **In-app update banner** — A banner appears when a newer version is available.
- **Manual update flow** — Check, download, install and restart from Settings.

### Fixed

- macOS window dragging works without relying on the resize border hit area.

### Improved

- Better error handling when release metadata is missing or incomplete.

---

## v1.0.0 — March 2026

First stable release.

### New

- In-app file editor with commit & push.
- Image preview in the file browser (PNG, JPG, GIF, SVG, WebP).
- Markdown preview toggle in the file viewer.
- Create and delete files with commit directly from the app.
- GitHub Changelog with full content, images & videos in-app.
- Branch creation support.

### Improved

- Multi-platform builds: macOS, Windows (x64/x86/ARM), Linux.
- Enhanced DOMPurify config for rich changelog content.

---

## v0.1.0 — March 2026

Initial release of NxtGit.

### New

- GitHub OAuth authentication with device flow.
- Repository browsing with file viewer and syntax highlighting.
- Issues and Pull Requests management.
- AI-powered code review with multiple providers (GitHub Copilot, OpenRouter, Anthropic, OpenAI, Ollama).
- Chat with AI about your codebase.
- GitHub Status monitoring with regional breakdown.
- GitHub Actions workflow runs viewer.
- Global search for repositories and users.
- User profile pages.
- Liquid Glass UI on macOS Tahoe.
- Dark and light mode.
