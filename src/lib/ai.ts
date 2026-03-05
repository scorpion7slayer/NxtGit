export interface AIProvider {
  id: string;
  name: string;
  placeholder: string;
  description: string;
}

export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openrouter',
    name: 'OpenRouter',
    placeholder: 'sk-or-...',
    description: 'Access multiple AI models through one API',
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    placeholder: 'ghu_...',
    description: 'AI pair programming by GitHub',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    description: 'Claude models',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-...',
    description: 'GPT models',
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    placeholder: 'sk-...',
    description: 'Kimi AI models',
  },
  {
    id: 'kilocode',
    name: 'Kilocode',
    placeholder: 'kc-...',
    description: 'Kilocode AI assistant',
  },
  {
    id: 'minimax',
    name: 'MiniMax',
    placeholder: 'eyJ...',
    description: 'MiniMax AI models',
  },
];
