import React, { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import { Button } from "./components/ui/button"
import { Badge } from "./components/ui/badge"
import { RefreshCw, MessageSquare, Settings } from "lucide-react"
import { useAppStore } from "./lib/store"
import { formatTimeAgo, getSentimentColor, getSentimentEmoji } from "./lib/utils"
import { SummaryView } from "./components/SummaryView"
import { SettingsTab } from "./components/SettingsTab"
import type { LLMSettings } from "./lib/types"
import "./style.css"

function IndexPopup() {
  const {
    currentSummary,
    isGenerating,
    settings,
    updateLLMSettings,
    setCurrentSummary,
    getSummaryByUrl
  } = useAppStore()
  
  const [currentTab, setCurrentTab] = useState("summary")
  const [currentUrl, setCurrentUrl] = useState<string | null>(null)
  const [llmSettings, setLlmSettings] = useState<LLMSettings>({
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
  })
  const [apiKeyValid, setApiKeyValid] = useState<boolean | null>(null)
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  // Load settings from Chrome storage
  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get(["llmSettings", "theme"])
      let settings: LLMSettings

      // Load theme
      if (result.theme) {
        setTheme(result.theme)
        console.log(`🎨 Loaded theme: ${result.theme}`)
      }

      if (result.llmSettings) {
        const storedSettings = result.llmSettings

        // Check if we have the old structure and migrate
        if (storedSettings.provider && storedSettings.apiKey && storedSettings.model) {
          // Old structure - migrate to new format
          console.log(`🔄 Migrating old settings format...`)
          
          const defaultSettings: LLMSettings = {
            currentProvider: "anthropic",
            providers: {
              anthropic: { apiKey: "", model: "claude-3-5-sonnet-20241022" },
              openai: { apiKey: "", model: "gpt-4o" },
              google: { apiKey: "", model: "gemini-2.5-flash" },
              xai: { apiKey: "", model: "grok-2-1212" }
            }
          }

          // Set the old provider's settings
          defaultSettings.currentProvider = storedSettings.provider
          defaultSettings.providers[storedSettings.provider] = {
            apiKey: storedSettings.apiKey,
            model: storedSettings.model
          }

          settings = defaultSettings
          await chrome.storage.local.set({ llmSettings: settings })
          console.log(`✅ Migration completed for ${storedSettings.provider}`)
        } else {
          // New structure
          settings = storedSettings
          console.log(`⚙️ Loaded per-provider settings`)
        }

        setLlmSettings(settings)
        // Also update the store for other components to use
        await updateLLMSettings(settings)
      } else {
        // No settings exist, save the defaults
        settings = {
          currentProvider: "anthropic",
          providers: {
            anthropic: {
              apiKey: "",
              model: "claude-3-5-sonnet-20241022"
            },
            openai: { apiKey: "", model: "gpt-4o" },
            google: { apiKey: "", model: "gemini-2.5-flash" },
            xai: { apiKey: "", model: "grok-2-1212" }
          }
        }
        await chrome.storage.local.set({ llmSettings: settings })
        setLlmSettings(settings)
        await updateLLMSettings(settings)
        console.log(`⚙️ Saved default per-provider settings`)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  // Save settings to Chrome storage
  const saveSettings = async (newSettings: LLMSettings) => {
    console.log("💾 saveSettings called", { provider: newSettings.currentProvider })
    
    try {
      await chrome.storage.local.set({ llmSettings: newSettings })
      setLlmSettings(newSettings)
      await updateLLMSettings(newSettings)
      console.log(`⚙️ Settings saved: ${newSettings.currentProvider}`)
      
      // Validate API key when settings change (force validation since user changed settings)
      const currentProvider = newSettings.providers[newSettings.currentProvider]
      console.log("🔧 About to validate after settings change", { 
        provider: newSettings.currentProvider,
        hasApiKey: !!currentProvider?.apiKey,
        hasModel: !!currentProvider?.model 
      })
      
      if (newSettings.currentProvider && currentProvider?.apiKey && currentProvider?.model) {
        console.log("✅ Conditions met, calling validateApiKey")
        await validateApiKey(newSettings, true)
      } else {
        console.log("❌ Conditions not met, setting apiKeyValid to null")
        setApiKeyValid(null)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
    }
  }

  // Validate API key
  const validateApiKey = async (settings: LLMSettings = llmSettings, forceValidation = false) => {
    console.log("🔍 validateApiKey called", { provider: settings.currentProvider, forceValidation })
    
    const currentProvider = settings.providers[settings.currentProvider]
    
    if (!settings.currentProvider || !currentProvider?.apiKey || !currentProvider?.model) {
      console.log("❌ Validation failed - missing provider, key, or model", { 
        provider: settings.currentProvider, 
        hasApiKey: !!currentProvider?.apiKey,
        hasModel: !!currentProvider?.model,
        currentProvider: currentProvider
      })
      setApiKeyValid(null)
      return false
    }
    
    console.log("✅ Validation preconditions passed, continuing...")

    // Check if we have cached validation result (valid for 5 minutes)
    if (!forceValidation && currentProvider.apiKeyValid !== undefined && currentProvider.lastValidated) {
      const lastValidatedTime = new Date(currentProvider.lastValidated).getTime()
      const now = new Date().getTime()
      const fiveMinutesInMs = 5 * 60 * 1000
      
      if (now - lastValidatedTime < fiveMinutesInMs) {
        console.log(`💾 Using cached validation result for ${settings.currentProvider}: ${currentProvider.apiKeyValid}`)
        setApiKeyValid(currentProvider.apiKeyValid)
        return currentProvider.apiKeyValid
      }
    }

    setIsValidatingApiKey(true)
    console.log(`🔍 Validating ${settings.currentProvider} API key...`)

    try {
      const { generateText } = await import("ai")

      let model
      if (settings.currentProvider === "anthropic") {
        const { createAnthropic } = await import("@ai-sdk/anthropic")
        const anthropic = createAnthropic({
          apiKey: currentProvider.apiKey,
          headers: { "anthropic-dangerous-direct-browser-access": "true" }
        })
        model = anthropic(currentProvider.model)
      } else if (settings.currentProvider === "openai") {
        const { createOpenAI } = await import("@ai-sdk/openai")
        const openai = createOpenAI({
          apiKey: currentProvider.apiKey,
          dangerouslyAllowBrowser: true
        })
        model = openai(currentProvider.model)
      } else if (settings.currentProvider === "google") {
        const { createGoogleGenerativeAI } = await import("@ai-sdk/google")
        const google = createGoogleGenerativeAI({
          apiKey: currentProvider.apiKey
        })
        model = google(currentProvider.model)
      } else if (settings.currentProvider === "xai") {
        const { createXai } = await import("@ai-sdk/xai")
        const xaiProvider = createXai({
          apiKey: currentProvider.apiKey
        })
        model = xaiProvider(currentProvider.model)
      }

      // Test with a simple prompt
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.log("⏰ TIMEOUT: Aborting API call after 10 seconds")
        controller.abort()
      }, 10000)
      
      try {
        await generateText({
          model: model,
          prompt: "Hello",
          maxTokens: 5,
          abortSignal: controller.signal
        })
        clearTimeout(timeoutId)
      } catch (error) {
        clearTimeout(timeoutId)
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          throw new Error(`API call timed out - connection to ${settings.currentProvider} may be blocked or slow`)
        }
        throw error
      }

      setApiKeyValid(true)
      console.log(`✅ API key validation successful`)
      
      // Cache the validation result
      const updatedSettings = {
        ...settings,
        providers: {
          ...settings.providers,
          [settings.currentProvider]: {
            ...currentProvider,
            apiKeyValid: true,
            lastValidated: new Date().toISOString()
          }
        }
      }
      await chrome.storage.local.set({ llmSettings: updatedSettings })
      setLlmSettings(updatedSettings)
      
      return true
    } catch (error) {
      setApiKeyValid(false)
      console.log(`❌ API key validation failed for ${settings.currentProvider}`)
      console.log(`❌ Error message: ${error.message}`)
      
      // Cache the validation failure
      const updatedSettings = {
        ...settings,
        providers: {
          ...settings.providers,
          [settings.currentProvider]: {
            ...currentProvider,
            apiKeyValid: false,
            lastValidated: new Date().toISOString()
          }
        }
      }
      await chrome.storage.local.set({ llmSettings: updatedSettings })
      setLlmSettings(updatedSettings)
      
      return false
    } finally {
      setIsValidatingApiKey(false)
    }
  }

  // Save theme to Chrome storage
  const saveTheme = async (newTheme: "light" | "dark") => {
    try {
      await chrome.storage.local.set({ theme: newTheme })
      setTheme(newTheme)
      console.log(`🎨 Theme saved: ${newTheme}`)
    } catch (error) {
      console.error("Error saving theme:", error)
    }
  }

  useEffect(() => {
    loadSettings()
    
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const url = tabs[0]?.url
      if (url) {
        setCurrentUrl(url)
        // Check if we have a summary for this URL
        const existingSummary = await getSummaryByUrl(url)
        if (existingSummary) {
          setCurrentSummary(existingSummary)
        }
      }
    })
  }, [])

  const handleRefresh = async () => {
    if (currentUrl) {
      // Clear current summary to force regeneration
      setCurrentSummary(null)
    }
  }

  return (
    <div className={`w-[400px] h-[600px] bg-background text-foreground ${theme}`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg">Chrome LLM Starter</h1>
          </div>
          {currentSummary && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isGenerating}
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>
        
        <div className="p-4 flex-1 overflow-auto">
          <TabsContent value="summary" className="mt-0">
            <SummaryView 
              currentUrl={currentUrl}
              apiKeyValid={llmSettings.currentProvider && llmSettings.providers[llmSettings.currentProvider] ? llmSettings.providers[llmSettings.currentProvider].apiKeyValid ?? apiKeyValid : apiKeyValid}
            />
          </TabsContent>
          
          <TabsContent value="settings" className="mt-0">
            <SettingsTab 
              llmSettings={llmSettings}
              onSaveSettings={saveSettings}
              apiKeyValid={llmSettings.currentProvider && llmSettings.providers[llmSettings.currentProvider] ? llmSettings.providers[llmSettings.currentProvider].apiKeyValid ?? apiKeyValid : apiKeyValid}
              isValidatingApiKey={isValidatingApiKey}
              theme={theme}
              onThemeChange={saveTheme}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

export default IndexPopup