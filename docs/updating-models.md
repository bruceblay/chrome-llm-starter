# Updating LLM Models

This guide explains how to update the available models for each AI provider in the Chrome LLM Starter.

## Model Definitions Location

The model definitions are located in **two key files**:

1. **`src/components/SettingsTab.tsx`** - Frontend UI model selection dropdown
2. **`src/popup.tsx`** - Default model settings in the settings initialization

## File Locations and Code Sections

### 1. SettingsTab.tsx (Lines ~120-175)

The model dropdown options are defined in the `SelectContent` sections for each provider:

```typescript
// Location: src/components/SettingsTab.tsx around line 120-175
{llmSettings.currentProvider === "anthropic" && (
  <>
    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
    <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
  </>
)}
```

### 2. popup.tsx (Lines ~26-46)

The default model settings are in the initial state:

```typescript
// Location: src/popup.tsx around line 26-46
const [llmSettings, setLlmSettings] = useState<LLMSettings>({
  currentProvider: 'anthropic',
  providers: {
    anthropic: {
      apiKey: '',
      model: 'claude-3-5-sonnet-20241022'  // Default model
    },
    openai: {
      apiKey: '',
      model: 'gpt-4o'  // Default model
    },
    // ... etc
  }
})
```

## Example: Adding New Models

### For Anthropic (Claude)
If Anthropic releases "claude-4-sonnet-20250101", add it to both files:

**SettingsTab.tsx:**
```tsx
{llmSettings.currentProvider === "anthropic" && (
  <>
    <SelectItem value="claude-4-sonnet-20250101">Claude 4 Sonnet</SelectItem>
    <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
    <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku</SelectItem>
    <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
  </>
)}
```

**popup.tsx:** (optionally update the default)
```tsx
anthropic: {
  apiKey: '',
  model: 'claude-4-sonnet-20250101'  // New default
}
```

## Prompt for LLM Coding Assistants

Use this prompt with your AI coding assistant to update models efficiently:

```
I need to add new models to my Chrome extension that uses multiple LLM providers. 

The extension has model definitions in two files:
1. src/components/SettingsTab.tsx - around lines 120-175 in SelectItem components
2. src/popup.tsx - around lines 26-46 in the initial state object

Please help me add these new models:

**Anthropic:**
- claude-4-sonnet-20250101 (display as "Claude 4 Sonnet") 
- claude-4-haiku-20250101 (display as "Claude 4 Haiku")

**OpenAI:**
- gpt-5-turbo (display as "GPT-5 Turbo")
- gpt-4o-2025 (display as "GPT-4o 2025")

**Google:**
- gemini-3.0-pro (display as "Gemini 3.0 Pro")

**xAI:**
- grok-3-latest (display as "Grok 3 Latest")

Please:
1. Add the SelectItem entries in the correct provider sections in SettingsTab.tsx
2. Optionally update the default models in popup.tsx to use the newest versions
3. Keep the existing models for backward compatibility
4. Follow the existing code style and formatting

Show me the exact code changes needed for both files.
```

## Current Model Support

### Anthropic Claude
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet (Default)
- `claude-3-5-haiku-20241022` - Claude 3.5 Haiku  
- `claude-3-opus-20240229` - Claude 3 Opus

### OpenAI GPT
- `gpt-4o` - GPT-4o (Default)
- `gpt-4o-mini` - GPT-4o Mini
- `gpt-4-turbo` - GPT-4 Turbo

### Google Gemini
- `gemini-2.5-flash` - Gemini 2.5 Flash (Default)
- `gemini-2.5-pro` - Gemini 2.5 Pro
- `gemini-1.5-pro` - Gemini 1.5 Pro (Legacy)
- `gemini-1.5-flash` - Gemini 1.5 Flash (Legacy)

### xAI Grok
- `grok-2-1212` - Grok 2 Latest (Default)
- `grok-2-vision-1212` - Grok 2 Vision Latest
- `grok-code-fast-1` - Grok Code Fast
- `grok-beta` - Grok Beta (Legacy)
- `grok-vision-beta` - Grok Vision Beta (Legacy)

## Best Practices

1. **Test new models** - Verify they work with the API endpoints before adding
2. **Update defaults carefully** - Consider backward compatibility 
3. **Use descriptive display names** - Make it clear which is the latest/recommended version
4. **Maintain legacy models** - Don't remove old models immediately as users may be using them
5. **Follow provider naming** - Use the exact model IDs from the provider's API documentation

## API Compatibility

The extension uses direct API calls, so model IDs must match exactly what each provider expects:

- **Anthropic**: Models defined in their Messages API documentation
- **OpenAI**: Models from their Chat Completions API
- **Google**: Models from their Generative AI API 
- **xAI**: Models from their Chat Completions API (OpenAI-compatible)

After updating models, rebuild the extension with `npm run build` and test with the new options.