# Chrome LLM Starter

A starting point for building Chrome extensions that utilize Vercel's AI SDK to connect to LLM providers.

This template provides a complete foundation for creating AI-powered Chrome extensions with support for multiple LLM providers including Anthropic, OpenAI, Google Gemini, and xAI.

## Features

- 🧠 **Multiple LLM Provider Support**: Anthropic Claude, OpenAI GPT, Google Gemini, and xAI Grok
- ⚙️ **Settings Management**: Easy-to-use settings tab with API key validation
- 🎨 **Theme Support**: Light and dark theme options
- 🔒 **Local Storage**: API keys stored locally and never shared
- 📦 **Modern Stack**: Built with React, TypeScript, Tailwind CSS, and Plasmo framework
- 🚀 **Ready to Use**: Includes a basic web page summarization feature as an example

## Quick Start

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Start development**:
   ```bash
   npm run dev
   ```

3. **Load the extension**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `build/chrome-mv3-dev` directory

4. **Configure your API key**:
   - Click the extension icon in your browser toolbar
   - Go to the Settings tab
   - Select your preferred AI provider and enter your API key

## Supported AI Providers

### Anthropic Claude
- Claude 3.5 Sonnet (Latest)
- Claude 3.5 Haiku
- Claude 3 Opus

### OpenAI
- GPT-4o
- GPT-4o Mini
- GPT-4 Turbo

### Google Gemini
- Gemini 2.5 Pro
- Gemini 2.5 Flash
- Gemini 1.5 Pro (Legacy)
- Gemini 1.5 Flash (Legacy)

### xAI Grok
- Grok 2 (Latest)
- Grok 2 Vision (Latest)
- Grok Code Fast
- Grok Beta (Legacy)
- Grok Vision Beta (Legacy)

## Project Structure

```
chrome-llm-starter/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── SettingsTab.tsx  # Settings configuration UI
│   │   └── SummaryView.tsx  # Example summarization feature
│   ├── lib/
│   │   ├── store.ts         # Zustand state management
│   │   ├── storage.ts       # Chrome storage utilities
│   │   ├── types.ts         # TypeScript type definitions
│   │   └── utils.ts         # Utility functions
│   ├── popup.tsx            # Main popup UI
│   ├── background.ts        # Background script
│   └── style.css           # Global styles
├── docs/                    # Documentation
├── package.json
└── README.md
```

## Building

To build for production:

```bash
npm run build
```

The built extension will be in the `build/chrome-mv3-prod` directory.

To package the extension:

```bash
npm run package
```

## Development

This project uses:
- **Plasmo**: Modern browser extension framework
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Zustand**: State management
- **Vercel AI SDK**: LLM integration

## API Key Setup

To use this extension, you'll need API keys from your chosen providers:

- **Anthropic**: Get your key at [console.anthropic.com](https://console.anthropic.com)
- **OpenAI**: Get your key at [platform.openai.com](https://platform.openai.com)
- **Google**: Get your key at [aistudio.google.com](https://aistudio.google.com)
- **xAI**: Get your key at [console.x.ai](https://console.x.ai)

## Customization

See the `/docs` folder for detailed guides on:
- Adding new views and components
- Integrating additional AI providers
- Customizing the UI theme
- Adding background processing
- Working with Chrome APIs

## License

MIT License - see LICENSE file for details

## Contributing

Contributions are welcome! Please read the contributing guidelines in `/docs/CONTRIBUTING.md`.