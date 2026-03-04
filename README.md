# NxtGit 🚀

AI-native Git client for macOS with Liquid Glass UI.

![NxtGit](screenshot.png)

## ✨ Features

- 🤖 **AI-Powered PR Descriptions** - Generate professional PR descriptions with OpenRouter
- 🔍 **Smart Code Review** - Get AI code reviews before submitting
- 🎨 **Liquid Glass UI** - Native macOS design with transparency and blur effects
- 🔐 **GitHub Integration** - Seamless OAuth authentication
- ⚡ **Lightning Fast** - Built with Tauri (Rust + Web technologies)
- 📝 **PR Management** - View, create and manage pull requests

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Rust (Tauri)
- **UI**: Liquid Glass design language (macOS native)
- **AI**: OpenRouter API (multi-model support)
- **API**: GitHub REST & GraphQL APIs

## 🚀 Getting Started

### Prerequisites

- macOS 14.0+
- Node.js 18+
- Rust toolchain

### Installation

```bash
# Clone the repository
git clone https://github.com/scorpion7slayer/NxtGit.git
cd NxtGit

# Install dependencies
npm install

# Run in development mode
npm run tauri-dev

# Build for production
npm run tauri-build
```

### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set callback URL to `http://localhost:1420/auth/callback`
4. Copy Client ID and Client Secret to the app settings

### OpenRouter Setup

1. Get your API key from [OpenRouter](https://openrouter.ai/)
2. Add it in the app Settings → OpenRouter AI

## 📝 Usage

1. **Login with GitHub** - Authenticate securely with OAuth
2. **Browse Repositories** - View all your repos without cloning
3. **Manage PRs** - Create and review pull requests
4. **AI Review** - Paste code and get intelligent suggestions
5. **Generate Descriptions** - Let AI write your PR descriptions

## 🏗️ Architecture

```
NxtGit/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── stores/            # Zustand state management
│   └── lib/               # Utilities and API clients
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   └── Cargo.toml         # Rust dependencies
└── package.json           # Node dependencies
```

## 🤝 Contributing

This project is built for [Flavortown](https://flavortown.hackclub.com/) - a Hack Club program for high schoolers.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - For the amazing desktop framework
- [OpenRouter](https://openrouter.ai/) - For AI model access
- [Hack Club](https://hackclub.com/) - For the Flavortown program

---

Built with ❤️ by @scorpion7slayer
