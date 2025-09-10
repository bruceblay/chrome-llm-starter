export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'xai';

export interface ProviderSettings {
  apiKey: string;
  model: string;
  apiKeyValid?: boolean | null;
  lastValidated?: string;
}

export interface LLMSettings {
  currentProvider: LLMProvider | '';
  providers: {
    anthropic: ProviderSettings;
    openai: ProviderSettings;
    google: ProviderSettings;
    xai: ProviderSettings;
  };
  temperature?: number;
  maxTokens?: number;
}

export interface SummaryResult {
  id: string;
  url: string;
  title: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  keyThemes: string[];
  commentCount: number;
  createdAt: string;
  processingTime: number;
}

export interface CommentData {
  text: string;
  author?: string;
  timestamp?: string;
  replies?: CommentData[];
  score?: number;
}

export interface SiteConfig {
  domain: string;
  selectors: string[];
  name: string;
  enabled: boolean;
}

export interface AppSettings {
  llm: LLMSettings;
  autoSummarize: boolean;
  summaryLength: 'brief' | 'detailed';
  minComments: number;
  enabledSites: SiteConfig[];
  customSelectors: string[];
}