import React, { useEffect, useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { RefreshCw, MessageSquare, Clock, TrendingUp } from 'lucide-react'
import { useAppStore } from '../lib/store'
import { formatTimeAgo, getSentimentColor, getSentimentEmoji } from '../lib/utils'
import type { CommentData } from '../lib/types'

interface SummaryViewProps {
  currentUrl: string | null
  apiKeyValid: boolean | null
}

export function SummaryView({ currentUrl, apiKeyValid }: SummaryViewProps) {
  const {
    currentSummary,
    isGenerating,
    settings,
    addSummary,
    setCurrentSummary,
    setGenerating,
    getSummaryByUrl
  } = useAppStore()
  
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState<string>('')

  useEffect(() => {
    if (currentUrl) {
      // Get page title
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const pageTitle = tabs[0]?.title || new URL(currentUrl).hostname
        setTitle(pageTitle)
      })
      
      // Check if we already have a summary for this URL
      loadExistingSummary(currentUrl)
    }
  }, [currentUrl, getSummaryByUrl])

  const loadExistingSummary = async (url: string) => {
    try {
      const existingSummary = await getSummaryByUrl(url)
      if (existingSummary) {
        setCurrentSummary(existingSummary)
      }
    } catch (error) {
      console.error('Error loading existing summary:', error)
    }
  }

  const handleSummarize = async () => {
    if (!currentUrl || !title) {
      setError('Unable to get current page information')
      return
    }

    const currentProvider = settings?.llm?.providers?.[settings?.llm?.currentProvider]
    if (!settings?.llm?.currentProvider || !currentProvider?.apiKey) {
      setError('Please configure your LLM API key in Settings')
      return
    }

    setError(null)
    setGenerating(true)
    setCurrentSummary(null)

    try {
      // Get current tab ID
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const tabId = tabs[0]?.id
      
      if (!tabId) {
        throw new Error('Unable to get current tab')
      }

      // Send message to background script for processing
      const summaryResult = await chrome.runtime.sendMessage({
        action: 'summarizePage',
        url: currentUrl,
        title,
        tabId
      })

      if (!summaryResult.success) {
        throw new Error(summaryResult.error || 'Failed to generate summary')
      }

      setCurrentSummary(summaryResult)
    } catch (error) {
      console.error('Summarization error:', error)
      setError(error instanceof Error ? error.message : 'Failed to summarize page')
    } finally {
      setGenerating(false)
    }
  }

  const handleRefresh = () => {
    setCurrentSummary(null)
    handleSummarize()
  }

  if (!currentUrl) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          Navigate to a webpage to get started
        </p>
      </div>
    )
  }

  if (currentSummary) {
    return (
      <div className="space-y-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-base font-medium leading-tight">
                {currentSummary.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formatTimeAgo(currentSummary.createdAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isGenerating}
            >
              <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary" className="gap-1">
              <MessageSquare className="h-3 w-3" />
              {currentSummary.commentCount} items
            </Badge>
            
            <Badge 
              variant="outline" 
              className={`gap-1 ${getSentimentColor(currentSummary.sentiment)}`}
            >
              <span>{getSentimentEmoji(currentSummary.sentiment)}</span>
              {currentSummary.sentiment}
            </Badge>
            
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {currentSummary.processingTime}ms
            </Badge>
          </div>
          
          <div>
            <h4 className="font-medium text-sm mb-2">Summary</h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {currentSummary.summary}
            </p>
          </div>
          
          {currentSummary.keyThemes.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Key Themes</h4>
              <div className="flex flex-wrap gap-1">
                {currentSummary.keyThemes.map((theme, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {theme}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-8">
      {error ? (
        <div>
          <div className="text-red-600 mb-4 text-sm">
            {error}
          </div>
          {error.includes('API key') ? (
            <p className="text-xs text-muted-foreground">
              Configure your LLM provider in the Settings tab
            </p>
          ) : (
            <Button 
              onClick={handleSummarize} 
              disabled={isGenerating || apiKeyValid !== true}
            >
              {isGenerating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              {isGenerating ? 'Generating...' : 'Try Again'}
            </Button>
          )}
        </div>
      ) : (
        <div>
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="font-medium mb-2">Ready to summarize</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Click below to analyze this page
          </p>
          <Button 
            onClick={handleSummarize} 
            disabled={isGenerating || apiKeyValid !== true}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Analyzing...' : 'Summarize'}
          </Button>
          {apiKeyValid !== true && !isGenerating && (
            <p className="text-xs text-muted-foreground mt-2">
              Configure a valid API key in Settings to enable summarization
            </p>
          )}
        </div>
      )}
    </div>
  )
}