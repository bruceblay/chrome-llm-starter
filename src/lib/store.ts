import { create } from 'zustand'
import type { SummaryResult, AppSettings, LLMSettings } from './types'
import { summaryStorage, settingsStorage } from './storage'

interface AppState {
  summaries: SummaryResult[]
  currentSummary: SummaryResult | null
  isLoading: boolean
  isGenerating: boolean
  apiKeyValid: boolean | null
  isValidating: boolean
  
  settings: AppSettings
  
  stats: {
    totalSummaries: number
    totalComments: number
    lastUpdated: string
    domains: string[]
  }
  
  loadSummaries: () => Promise<void>
  addSummary: (summaryData: Omit<SummaryResult, 'id' | 'createdAt'>) => Promise<SummaryResult | null>
  deleteSummary: (id: string) => Promise<void>
  getSummaryByUrl: (url: string) => Promise<SummaryResult | null>
  setCurrentSummary: (summary: SummaryResult | null) => void
  
  loadSettings: () => Promise<void>
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>
  updateLLMSettings: (updates: Partial<LLMSettings>) => Promise<void>
  
  loadStats: () => Promise<void>
  
  setGenerating: (generating: boolean) => void
  setApiKeyValid: (valid: boolean | null) => void
  validateApiKey: () => Promise<void>
}

export const useAppStore = create<AppState>((set, get) => ({
  summaries: [],
  currentSummary: null,
  isLoading: false,
  isGenerating: false,
  apiKeyValid: null,
  isValidating: false,
  settings: {
    llm: {
      currentProvider: 'anthropic',
      providers: {
        anthropic: {
          apiKey: '',
          model: 'claude-3-5-sonnet-20241022'
        },
        openai: {
          apiKey: '',
          model: 'gpt-4o'
        },
        google: {
          apiKey: '',
          model: 'gemini-2.5-flash'
        },
        xai: {
          apiKey: '',
          model: 'grok-2-1212'
        }
      },
      temperature: 0.7,
      maxTokens: 1000
    },
    autoSummarize: true,
    summaryLength: 'brief',
    minComments: 5,
    enabledSites: [],
    customSelectors: []
  },
  stats: {
    totalSummaries: 0,
    totalComments: 0,
    lastUpdated: new Date().toISOString(),
    domains: []
  },
  
  loadSummaries: async () => {
    set({ isLoading: true })
    try {
      const summaries = await summaryStorage.getAllSummaries()
      set({ summaries, isLoading: false })
    } catch (error) {
      console.error('Error loading summaries:', error)
      set({ isLoading: false })
    }
  },
  
  addSummary: async (summaryData) => {
    try {
      const newSummary = await summaryStorage.createSummary(summaryData)
      const currentSummaries = get().summaries
      set({ summaries: [newSummary, ...currentSummaries] })
      await get().loadStats()
      return newSummary
    } catch (error) {
      console.error('Error adding summary:', error)
      return null
    }
  },
  
  deleteSummary: async (id) => {
    try {
      await summaryStorage.deleteSummary(id)
      const currentSummaries = get().summaries
      set({ summaries: currentSummaries.filter(summary => summary.id !== id) })
      await get().loadStats()
    } catch (error) {
      console.error('Error deleting summary:', error)
    }
  },
  
  getSummaryByUrl: async (url) => {
    try {
      return await summaryStorage.getSummaryByUrl(url)
    } catch (error) {
      console.error('Error getting summary by URL:', error)
      return null
    }
  },
  
  setCurrentSummary: (summary) => {
    set({ currentSummary: summary })
  },
  
  loadSettings: async () => {
    try {
      const settings = await settingsStorage.getSettings()
      set({ settings })
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  },
  
  updateSettings: async (updates) => {
    try {
      const newSettings = await settingsStorage.updateSettings(updates)
      set({ settings: newSettings })
    } catch (error) {
      console.error('Error updating settings:', error)
    }
  },
  
  updateLLMSettings: async (updates) => {
    try {
      const newLLMSettings = await settingsStorage.updateLLMSettings(updates)
      const currentSettings = get().settings
      set({ settings: { ...currentSettings, llm: newLLMSettings } })
    } catch (error) {
      console.error('Error updating LLM settings:', error)
    }
  },
  
  loadStats: async () => {
    try {
      const stats = await summaryStorage.getStats()
      set({ stats })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  },
  
  setGenerating: (generating) => {
    set({ isGenerating: generating })
  },
  
  setApiKeyValid: (valid) => {
    set({ apiKeyValid: valid })
  },
  
  validateApiKey: async () => {
    const { settings } = get()
    const currentProvider = settings?.llm?.providers?.[settings?.llm?.currentProvider]
    
    if (!currentProvider?.apiKey || !currentProvider?.model || !settings?.llm?.currentProvider) {
      set({ apiKeyValid: false })
      return
    }
    
    set({ isValidating: true })
    try {
      const { generateText } = await import('ai')
      
      let model: any
      switch (settings.llm.currentProvider) {
        case 'anthropic':
          const { createAnthropic } = await import('@ai-sdk/anthropic')
          const anthropic = createAnthropic({
            apiKey: currentProvider.apiKey,
            headers: { "anthropic-dangerous-direct-browser-access": "true" }
          })
          model = anthropic(currentProvider.model)
          break
        case 'openai':
          const { createOpenAI } = await import('@ai-sdk/openai')
          const openai = createOpenAI({
            apiKey: currentProvider.apiKey
          })
          model = openai(currentProvider.model)
          break
        case 'google':
          const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
          const google = createGoogleGenerativeAI({
            apiKey: currentProvider.apiKey
          })
          model = google(currentProvider.model)
          break
        case 'xai':
          const { createXai } = await import('@ai-sdk/xai')
          const xai = createXai({
            apiKey: currentProvider.apiKey
          })
          model = xai(currentProvider.model)
          break
      }
      
      await generateText({
        model,
        prompt: 'Hello'
      })
      
      set({ apiKeyValid: true })
    } catch (error) {
      console.error('API validation error:', error)
      set({ apiKeyValid: false })
    } finally {
      set({ isValidating: false })
    }
  }
}))