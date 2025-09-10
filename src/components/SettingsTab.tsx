import React from "react"
import {
  SunIcon,
  MoonIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from "@heroicons/react/24/outline"

import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select"

// Per-provider settings interface
interface ProviderSettings {
  apiKey: string
  model: string
}

// Settings interface
interface LLMSettings {
  currentProvider: "openai" | "anthropic" | "google" | "xai" | ""
  providers: {
    openai: ProviderSettings
    anthropic: ProviderSettings
    google: ProviderSettings
    xai: ProviderSettings
  }
}

interface SettingsTabProps {
  llmSettings: LLMSettings
  onSaveSettings: (settings: LLMSettings) => void
  apiKeyValid: boolean | null
  isValidatingApiKey: boolean
  theme: "light" | "dark"
  onThemeChange: (theme: "light" | "dark") => void
}

export function SettingsTab({ llmSettings, onSaveSettings, apiKeyValid, isValidatingApiKey, theme, onThemeChange }: SettingsTabProps) {
  const currentProvider = llmSettings.providers[llmSettings.currentProvider]
  
  return (
    <div className="space-y-4">
      {/* Theme Settings */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Appearance</Label>
        <div className="flex gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => onThemeChange("light")}
            className="flex-1">
            <SunIcon className="w-4 h-4 mr-2" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => onThemeChange("dark")}
            className="flex-1">
            <MoonIcon className="w-4 h-4 mr-2" />
            Dark
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="provider">AI Provider</Label>
          <Select
            value={llmSettings.currentProvider}
            onValueChange={(value: "openai" | "anthropic" | "google" | "xai" | "") =>
              onSaveSettings({
                ...llmSettings,
                currentProvider: value
              })
            }>
            <SelectTrigger>
              <SelectValue placeholder="Select AI provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anthropic">Anthropic</SelectItem>
              <SelectItem value="google">Google Gemini</SelectItem>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="xai">xAI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {llmSettings.currentProvider && (
          <>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={currentProvider.model}
                onValueChange={(value) =>
                  onSaveSettings({
                    ...llmSettings,
                    providers: {
                      ...llmSettings.providers,
                      [llmSettings.currentProvider]: {
                        ...currentProvider,
                        model: value
                      }
                    }
                  })
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {llmSettings.currentProvider === "openai" && (
                    <>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                    </>
                  )}
                  {llmSettings.currentProvider === "anthropic" && (
                    <>
                      <SelectItem value="claude-3-5-sonnet-20241022">
                        Claude 3.5 Sonnet
                      </SelectItem>
                      <SelectItem value="claude-3-5-haiku-20241022">
                        Claude 3.5 Haiku
                      </SelectItem>
                      <SelectItem value="claude-3-opus-20240229">
                        Claude 3 Opus
                      </SelectItem>
                    </>
                  )}
                  {llmSettings.currentProvider === "google" && (
                    <>
                      <SelectItem value="gemini-2.5-pro">
                        Gemini 2.5 Pro
                      </SelectItem>
                      <SelectItem value="gemini-2.5-flash">
                        Gemini 2.5 Flash
                      </SelectItem>
                      <SelectItem value="gemini-1.5-pro">
                        Gemini 1.5 Pro (Legacy)
                      </SelectItem>
                      <SelectItem value="gemini-1.5-flash">
                        Gemini 1.5 Flash (Legacy)
                      </SelectItem>
                    </>
                  )}
                  {llmSettings.currentProvider === "xai" && (
                    <>
                      <SelectItem value="grok-2-1212">
                        Grok 2 (Latest)
                      </SelectItem>
                      <SelectItem value="grok-2-vision-1212">
                        Grok 2 Vision (Latest)
                      </SelectItem>
                      <SelectItem value="grok-code-fast-1">
                        Grok Code Fast
                      </SelectItem>
                      <SelectItem value="grok-beta">
                        Grok Beta (Legacy)
                      </SelectItem>
                      <SelectItem value="grok-vision-beta">
                        Grok Vision Beta (Legacy)
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder={`Enter your ${llmSettings.currentProvider} API key`}
                value={currentProvider.apiKey}
                onChange={(e) =>
                  onSaveSettings({
                    ...llmSettings,
                    providers: {
                      ...llmSettings.providers,
                      [llmSettings.currentProvider]: {
                        ...currentProvider,
                        apiKey: e.target.value
                      }
                    }
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Your API key is stored locally and never shared.
              </p>
            </div>
          </>
        )}

        {llmSettings.currentProvider &&
          currentProvider.apiKey &&
          currentProvider.model && (
            <div className="pt-4 border-t border-border">
              {isValidatingApiKey ? (
                <div className="flex items-center gap-2 text-blue-600">
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  <span className="text-xs font-medium">
                    Validating API Key...
                  </span>
                </div>
              ) : apiKeyValid === true ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    API Key Valid
                  </span>
                </div>
              ) : apiKeyValid === false ? (
                <div className="flex items-center gap-2 text-red-600">
                  <ExclamationCircleIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Invalid API Key
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-600">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    Configuration Complete
                  </span>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {isValidatingApiKey
                  ? "Validating API key..."
                  : apiKeyValid === true 
                  ? `Ready to use ${llmSettings.currentProvider} ${currentProvider.model}`
                  : apiKeyValid === false 
                  ? "Please check your API key and try again"
                  : "API key validation pending"}
              </p>
            </div>
          )}
      </div>
    </div>
  )
}