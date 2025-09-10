import { get, set, del, keys, clear } from 'idb-keyval'
import type { SummaryResult, AppSettings, LLMSettings } from './types'

const SUMMARIES_PREFIX = 'summary:'
const SETTINGS_KEY = 'settings'
const LLM_SETTINGS_KEY = 'llm_settings'
const STATS_KEY = 'stats'

export class SummaryStorage {
  async createSummary(summaryData: Omit<SummaryResult, 'id' | 'createdAt'>): Promise<SummaryResult> {
    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()
    
    const summary: SummaryResult = {
      id,
      createdAt,
      ...summaryData
    }
    
    await set(`${SUMMARIES_PREFIX}${id}`, summary)
    await this.updateStats()
    
    return summary
  }
  
  async getSummary(id: string): Promise<SummaryResult | null> {
    try {
      const summary = await get(`${SUMMARIES_PREFIX}${id}`)
      return summary || null
    } catch (error) {
      console.error('Error getting summary:', error)
      return null
    }
  }
  
  async getSummaryByUrl(url: string): Promise<SummaryResult | null> {
    try {
      const allSummaries = await this.getAllSummaries()
      return allSummaries.find(summary => summary.url === url) || null
    } catch (error) {
      console.error('Error getting summary by URL:', error)
      return null
    }
  }
  
  async getAllSummaries(): Promise<SummaryResult[]> {
    try {
      const allKeys = await keys()
      const summaryKeys = allKeys.filter(key => 
        typeof key === 'string' && key.startsWith(SUMMARIES_PREFIX)
      )
      
      const summaries: SummaryResult[] = []
      for (const key of summaryKeys) {
        const summary = await get(key)
        if (summary) summaries.push(summary)
      }
      
      return summaries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (error) {
      console.error('Error getting all summaries:', error)
      return []
    }
  }
  
  async deleteSummary(id: string): Promise<boolean> {
    try {
      await del(`${SUMMARIES_PREFIX}${id}`)
      await this.updateStats()
      return true
    } catch (error) {
      console.error('Error deleting summary:', error)
      return false
    }
  }
  
  private async updateStats(): Promise<void> {
    try {
      const summaries = await this.getAllSummaries()
      const stats = {
        totalSummaries: summaries.length,
        totalComments: summaries.reduce((sum, s) => sum + s.commentCount, 0),
        lastUpdated: new Date().toISOString(),
        domains: [...new Set(summaries.map(s => new URL(s.url).hostname))]
      }
      
      await set(STATS_KEY, stats)
    } catch (error) {
      console.error('Error updating stats:', error)
    }
  }
  
  async getStats() {
    try {
      const stats = await get(STATS_KEY)
      return stats || {
        totalSummaries: 0,
        totalComments: 0,
        lastUpdated: new Date().toISOString(),
        domains: []
      }
    } catch (error) {
      console.error('Error getting stats:', error)
      return {
        totalSummaries: 0,
        totalComments: 0,
        lastUpdated: new Date().toISOString(),
        domains: []
      }
    }
  }
}

export class SettingsStorage {
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await get(SETTINGS_KEY)
      return settings || {
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
          temperature: 0.7
        },
        autoSummarize: true,
        summaryLength: 'brief',
        minComments: 5,
        enabledSites: [],
        customSelectors: []
      }
    } catch (error) {
      console.error('Error getting settings:', error)
      return {
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
          temperature: 0.7
        },
        autoSummarize: true,
        summaryLength: 'brief',
        minComments: 5,
        enabledSites: [],
        customSelectors: []
      }
    }
  }
  
  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const currentSettings = await this.getSettings()
      const newSettings = { ...currentSettings, ...updates }
      await set(SETTINGS_KEY, newSettings)
      return newSettings
    } catch (error) {
      console.error('Error updating settings:', error)
      return await this.getSettings()
    }
  }
  
  async getLLMSettings(): Promise<LLMSettings> {
    try {
      const settings = await get(LLM_SETTINGS_KEY)
      return settings || {
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
      }
    } catch (error) {
      console.error('Error getting LLM settings:', error)
      return {
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
      }
    }
  }
  
  async updateLLMSettings(updates: Partial<LLMSettings>): Promise<LLMSettings> {
    try {
      const currentSettings = await this.getLLMSettings()
      const newSettings = { ...currentSettings, ...updates }
      await set(LLM_SETTINGS_KEY, newSettings)
      
      const appSettings = await this.getSettings()
      await this.updateSettings({ llm: newSettings })
      
      return newSettings
    } catch (error) {
      console.error('Error updating LLM settings:', error)
      return await this.getLLMSettings()
    }
  }
}

export const summaryStorage = new SummaryStorage()
export const settingsStorage = new SettingsStorage()