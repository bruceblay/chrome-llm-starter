// Remove AI SDK imports from background script to avoid service worker import issues

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

    // Generate summary using LLM (offload to a different approach to avoid service worker issues)
    const summaryResult = await generateSummaryViaFetch(pageContent, title, settings)
    
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
    // Inject content script to get page content using the same pattern as vibe-sum
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: extractPageContent
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

// Function that runs in the page context to extract content - following vibe-sum pattern
function extractPageContent(): string {
  try {
    console.log('📄 Extracting page content...')
    
    // Similar to vibe-sum's extractPageContext but focused on getting clean text content
    const contentSources = [
      'main',
      '[role="main"]', 
      'article',
      '.content',
      '#content',
      '.post-content',
      '.entry-content',
      '.article-content',
      'body'
    ]
    
    let bestContent = ''
    
    // Try each selector to find the main content
    for (const selector of contentSources) {
      try {
        const element = document.querySelector(selector)
        if (element) {
          // Clone the element to avoid modifying the original page
          const clone = element.cloneNode(true) as Element
          
          // Remove noise elements
          const noise = clone.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads, .sidebar, .menu, .navigation, [class*="comment"], [id*="comment"]')
          noise.forEach(el => el.remove())
          
          const textContent = clone.textContent || ''
          if (textContent.trim().length > bestContent.length) {
            bestContent = textContent.trim()
          }
          
          // If we found substantial content, use it
          if (bestContent.length > 500) break
        }
      } catch (e) {
        console.warn(`Error with selector ${selector}:`, e)
      }
    }
    
    // Clean up the content
    const cleanContent = bestContent
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
      .trim()
    
    console.log(`📄 Extracted ${cleanContent.length} characters of content`)
    return cleanContent
    
  } catch (error) {
    console.error('Error in extractPageContent:', error)
    // Final fallback
    return document.body?.textContent?.replace(/\s+/g, ' ').trim() || ''
  }
}

async function generateSummaryViaFetch(content: string, title: string, settings: any) {
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
    let apiResponse

    // Use direct API calls to avoid service worker import issues
    if (settings.currentProvider === 'anthropic') {
      apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': currentProvider.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: currentProvider.model,
          max_tokens: 500,
          temperature: 0.7,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      })
      
      if (!apiResponse.ok) {
        throw new Error(`Anthropic API error: ${apiResponse.status} ${apiResponse.statusText}`)
      }
      
      const data = await apiResponse.json()
      const text = data.content[0].text

      // Try to parse JSON response
      try {
        const parsed = JSON.parse(text)
        return {
          ...parsed,
          wordCount
        }
      } catch {
        return {
          summary: text,
          sentiment: 'neutral',
          keyThemes: [],
          wordCount
        }
      }
    } else if (settings.currentProvider === 'openai') {
      apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentProvider.apiKey}`
        },
        body: JSON.stringify({
          model: currentProvider.model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 500,
          temperature: 0.7
        })
      })
      
      if (!apiResponse.ok) {
        throw new Error(`OpenAI API error: ${apiResponse.status} ${apiResponse.statusText}`)
      }
      
      const data = await apiResponse.json()
      const text = data.choices[0].message.content

      try {
        const parsed = JSON.parse(text)
        return {
          ...parsed,
          wordCount
        }
      } catch {
        return {
          summary: text,
          sentiment: 'neutral',
          keyThemes: [],
          wordCount
        }
      }
    } else if (settings.currentProvider === 'google') {
      apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${currentProvider.model}:generateContent?key=${currentProvider.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      })
      
      if (!apiResponse.ok) {
        throw new Error(`Google API error: ${apiResponse.status} ${apiResponse.statusText}`)
      }
      
      const data = await apiResponse.json()
      const text = data.candidates[0].content.parts[0].text

      try {
        const parsed = JSON.parse(text)
        return {
          ...parsed,
          wordCount
        }
      } catch {
        return {
          summary: text,
          sentiment: 'neutral',
          keyThemes: [],
          wordCount
        }
      }
    } else if (settings.currentProvider === 'xai') {
      apiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentProvider.apiKey}`
        },
        body: JSON.stringify({
          model: currentProvider.model,
          messages: [{
            role: 'user',
            content: prompt
          }],
          max_tokens: 500,
          temperature: 0.7
        })
      })
      
      if (!apiResponse.ok) {
        throw new Error(`xAI API error: ${apiResponse.status} ${apiResponse.statusText}`)
      }
      
      const data = await apiResponse.json()
      const text = data.choices[0].message.content

      try {
        const parsed = JSON.parse(text)
        return {
          ...parsed,
          wordCount
        }
      } catch {
        return {
          summary: text,
          sentiment: 'neutral',
          keyThemes: [],
          wordCount
        }
      }
    } else {
      throw new Error('Unsupported provider')
    }
  } catch (error) {
    console.error('Error generating summary:', error)
    throw error
  }
}