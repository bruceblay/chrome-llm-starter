import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date()
  const then = new Date(date)
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours}h ago`
  }
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `${diffInDays}d ago`
  }
  
  return then.toLocaleDateString()
}

export function getSentimentColor(sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'): string {
  switch (sentiment) {
    case 'positive':
      return 'text-green-600'
    case 'negative':
      return 'text-red-600'
    case 'mixed':
      return 'text-yellow-600'
    default:
      return 'text-gray-600'
  }
}

export function getSentimentEmoji(sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'): string {
  switch (sentiment) {
    case 'positive':
      return '😊'
    case 'negative':
      return '😔'
    case 'mixed':
      return '🤔'
    default:
      return '😐'
  }
}