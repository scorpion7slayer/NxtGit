# Security Policy

## Supported Versions

Security updates are provided for the latest stable version on the `main` branch.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security seriously in NxtGit. If you discover a security vulnerability, please **do not** open a public GitHub issue.

### How to report

Use the **[Private vulnerability reporting](https://github.com/scorpion7slayer/NxtGit/security/advisories/new)** feature on GitHub to report vulnerabilities confidentially.

Alternatively, you can contact the maintainer directly via GitHub.

### What to include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### Response time

- You will receive an acknowledgment within **48 hours**
- We aim to release a patch within **7 days** for critical issues
- You will be credited in the security advisory (unless you prefer anonymity)

## Scope

This policy applies to:
- The NxtGit desktop application (Tauri + TypeScript)
- API token handling (GitHub, GitHub Copilot, OpenRouter, Anthropic, OpenAI, Ollama, Moonshot, Kilocode, MiniMax)
- Any secrets stored via `@tauri-apps/plugin-store`

## Out of Scope

- Vulnerabilities in third-party dependencies (please report those upstream)
- Issues related to user misconfiguration
