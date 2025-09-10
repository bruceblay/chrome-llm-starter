import { Readability } from "@mozilla/readability"

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('🔄 Background received message:', request.action)

  if (request.action === 'summarizePage') {
    handleSummarizePage(request, sendResponse)
    return true // Will respond asynchronously
  }

  return false
})

async function handleSummarizePage(request: any, sendResponse: (response: any) => void) {
  const { url, title, tabId } = request
  const startTime = Date.now()

  try {
    console.log('📄 Starting page summarization for:', url)

    // Get page content
    const pageContent = await getPageContent(tabId)
    if (!pageContent) {
      sendResponse({
        success: false,
        error: 'Could not extract page content'
      })
      return
    }

    console.log('📝 Extracted content length:', pageContent.length)

    // Get LLM settings from storage
    const result = await chrome.storage.local.get(['llmSettings'])
    if (!result.llmSettings) {
      sendResponse({
        success: false,
        error: 'LLM settings not configured'
      })
      return
    }

    const settings = result.llmSettings
    const currentProvider = settings.providers[settings.currentProvider]

    if (!currentProvider?.apiKey) {
      sendResponse({
        success: false,
        error: 'API key not configured'
      })
      return
    }

    // Generate summary using LLM
    const summaryResult = await generateSummary(pageContent, title, settings)
    
    const processingTime = Date.now() - startTime

    // Create summary object
    const summary = {
      id: crypto.randomUUID(),
      url,
      title,
      summary: summaryResult.summary,
      sentiment: summaryResult.sentiment || 'neutral',
      keyThemes: summaryResult.keyThemes || [],
      commentCount: summaryResult.wordCount || 0,
      createdAt: new Date().toISOString(),
      processingTime,
      success: true
    }

    console.log('✅ Summary generated successfully')
    sendResponse(summary)

  } catch (error) {
    console.error('❌ Error in handleSummarizePage:', error)
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate summary'
    })
  }
}

async function getPageContent(tabId: number): Promise<string | null> {
  try {
    // Inject content script to get page content
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      function: extractPageContent
    })

    if (results && results[0] && results[0].result) {
      return results[0].result
    }

    return null
  } catch (error) {
    console.error('Error extracting page content:', error)
    return null
  }
}

// Function that runs in the page context to extract content
function extractPageContent(): string {
  try {
    // Use Readability to extract main content
    const documentClone = document.cloneNode(true) as Document
    const reader = new Readability(documentClone)
    const article = reader.parse()

    if (article && article.textContent) {
      // Return cleaned text content
      return article.textContent.trim()
    }

    // Fallback: get all text content
    const textContent = document.body.innerText || document.body.textContent || ''
    return textContent.trim()
  } catch (error) {
    console.error('Error in extractPageContent:', error)
    // Final fallback
    return document.body.innerText || document.body.textContent || ''
  }
}

async function generateSummary(content: string, title: string, settings: any) {
  const currentProvider = settings.providers[settings.currentProvider]
  
  // Truncate content if too long (keep first ~3000 words to stay within token limits)
  const words = content.split(/\s+/)
  const truncatedContent = words.slice(0, 3000).join(' ')
  const wordCount = words.length

  const prompt = `Please analyze the following web page content and provide a comprehensive summary.

Title: ${title}

Content:
${truncatedContent}

Please provide your response in the following JSON format:
{
  "summary": "A clear, concise summary of the main points and key information from this page (2-3 sentences)",
  "sentiment": "overall sentiment of the content (positive, negative, neutral, or mixed)",
  "keyThemes": ["array", "of", "key", "themes", "or", "topics"]
}

Focus on the main ideas, key facts, and important takeaways. Keep the summary informative but brief.`

  try {
    // Dynamic import based on provider
    if (settings.currentProvider === 'anthropic') {
      const { generateText } = await import('ai')
      const { createAnthropic } = await import('@ai-sdk/anthropic')
      
      const anthropic = createAnthropic({
        apiKey: currentProvider.apiKey,
        headers: { "anthropic-dangerous-direct-browser-access": "true" }
      })
      
      const model = anthropic(currentProvider.model)
      
      const result = await generateText({
        model,
        prompt,
        maxTokens: 500,
        temperature: 0.7
      })

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(result.text)
        return {
          ...parsed,
          wordCount
        }
      } catch {
        // If JSON parsing fails, return a basic response
        return {
          summary: result.text,
          sentiment: 'neutral',
          keyThemes: [],
          wordCount
        }
      }
    }

    if (settings.currentProvider === 'openai') {
      const { generateText } = await import('ai')
      const { createOpenAI } = await import('@ai-sdk/openai')
      
      const openai = createOpenAI({
        apiKey: currentProvider.apiKey,
        dangerouslyAllowBrowser: true
      })
      
      const model = openai(currentProvider.model)
      
      const result = await generateText({
        model,
        prompt,
        maxTokens: 500,
        temperature: 0.7
      })

      try {
        const parsed = JSON.parse(result.text)
        return {
          ...parsed,
          wordCount
        }
      } catch {
        return {
          summary: result.text,
          sentiment: 'neutral',
          keyThemes: [],
          wordCount
        }
      }
    }

    if (settings.currentProvider === 'google') {
      const { generateText } = await import('ai')
      const { createGoogleGenerativeAI } = await import('@ai-sdk/google')
      
      const google = createGoogleGenerativeAI({
        apiKey: currentProvider.apiKey
      })
      
      const model = google(currentProvider.model)
      
      const result = await generateText({
        model,
        prompt,
        maxTokens: 500,
        temperature: 0.7
      })

      try {
        const parsed = JSON.parse(result.text)
        return {
          ...parsed,
          wordCount
        }
      } catch {
        return {
          summary: result.text,
          sentiment: 'neutral',
          keyThemes: [],
          wordCount
        }
      }
    }

    if (settings.currentProvider === 'xai') {
      const { generateText } = await import('ai')
      const { createXai } = await import('@ai-sdk/xai')
      
      const xai = createXai({
        apiKey: currentProvider.apiKey
      })
      
      const model = xai(currentProvider.model)
      
      const result = await generateText({
        model,
        prompt,
        maxTokens: 500,
        temperature: 0.7
      })

      try {
        const parsed = JSON.parse(result.text)
        return {
          ...parsed,
          wordCount
        }
      } catch {
        return {
          summary: result.text,
          sentiment: 'neutral',
          keyThemes: [],
          wordCount
        }
      }
    }

    throw new Error('Unsupported provider')
  } catch (error) {
    console.error('Error generating summary:', error)
    throw error
  }
}