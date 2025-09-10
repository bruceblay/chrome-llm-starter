# Adding Views

This guide explains how to add new views and components to your Chrome extension popup.

## Overview

The starter template uses a tab-based layout with React and the Radix UI Tabs component. Adding new views involves:

1. Creating your view component
2. Adding it to the tabs configuration
3. Updating the popup layout

## Step-by-Step Guide

### 1. Create Your View Component

Create a new component in `src/components/`:

```tsx
// src/components/MyNewView.tsx
import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Button } from "./ui/button"

interface MyNewViewProps {
  // Define your props here
}

export function MyNewView({ }: MyNewViewProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My New Feature</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Your content here</p>
          <Button onClick={() => console.log("Button clicked!")}>
            Try It
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. Add Your View to the Popup

Update `src/popup.tsx` to include your new view:

```tsx
import { MyNewView } from "./components/MyNewView"

// Add your tab to the TabsList
<TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
  <TabsTrigger value="summary">Summary</TabsTrigger>
  <TabsTrigger value="mynewview">My View</TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</TabsList>

// Add your TabsContent
<TabsContent value="mynewview" className="mt-0">
  <MyNewView />
</TabsContent>
```

### 3. Add Icons (Optional)

To include an icon in your tab, import it from Lucide React:

```tsx
import { Star } from "lucide-react"

<TabsTrigger value="mynewview">
  <Star className="h-4 w-4 mr-2" />
  My View
</TabsTrigger>
```

## Advanced Patterns

### State Management

If your view needs to share state with other parts of the extension, use the Zustand store:

```tsx
// In src/lib/store.ts, add to your store:
interface AppStore {
  // existing state...
  myNewViewData: string | null
  setMyNewViewData: (data: string) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  // existing state...
  myNewViewData: null,
  setMyNewViewData: (data) => set({ myNewViewData: data }),
}))
```

Then use it in your component:

```tsx
import { useAppStore } from "../lib/store"

export function MyNewView() {
  const { myNewViewData, setMyNewViewData } = useAppStore()
  
  // Your component logic here
}
```

### Chrome API Integration

If your view needs to interact with Chrome APIs:

```tsx
import { useEffect, useState } from "react"

export function MyNewView() {
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null)
  
  useEffect(() => {
    // Get current tab information
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentTab(tabs[0])
      }
    })
  }, [])
  
  // Your component logic here
}
```

### Persistent Data

To store data that persists across browser sessions:

```tsx
import { useEffect, useState } from "react"

export function MyNewView() {
  const [savedData, setSavedData] = useState<string>("")
  
  // Load data on component mount
  useEffect(() => {
    chrome.storage.local.get(["myViewData"]).then((result) => {
      if (result.myViewData) {
        setSavedData(result.myViewData)
      }
    })
  }, [])
  
  // Save data function
  const saveData = async (data: string) => {
    await chrome.storage.local.set({ myViewData: data })
    setSavedData(data)
  }
  
  // Your component logic here
}
```

## UI Components

The starter template includes a comprehensive set of UI components from Radix UI and custom components. Available components include:

- `Button` - Various button styles and sizes
- `Card` - Card layouts with header and content
- `Input` - Form inputs
- `Label` - Form labels
- `Select` - Dropdown selections
- `Tabs` - Tab navigation
- `Badge` - Status indicators

See the [Component Library](./components.md) for full documentation.

## Styling

The template uses Tailwind CSS for styling. Common patterns:

```tsx
// Spacing
<div className="space-y-4">  // Vertical spacing between children
<div className="space-x-2">  // Horizontal spacing between children
<div className="p-4">        // Padding
<div className="m-4">        // Margin

// Layout
<div className="flex items-center justify-between">
<div className="grid grid-cols-2 gap-4">

// Text
<h1 className="text-lg font-semibold">
<p className="text-sm text-muted-foreground">
```

## Best Practices

1. **Keep components small and focused** - Each view should handle one main feature
2. **Use TypeScript** - Define proper interfaces for props and data
3. **Handle loading states** - Show loading indicators for async operations
4. **Error handling** - Gracefully handle API failures and errors
5. **Responsive design** - Ensure your view works in the popup's fixed width
6. **Accessibility** - Use semantic HTML and proper ARIA labels

## Example: Adding a History View

Here's a complete example of adding a history view that shows previously processed data:

```tsx
// src/components/HistoryView.tsx
import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { Trash2, Clock } from "lucide-react"

interface HistoryItem {
  id: string
  url: string
  title: string
  timestamp: number
  type: 'summary' | 'analysis'
}

export function HistoryView() {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadHistory()
  }, [])
  
  const loadHistory = async () => {
    try {
      const result = await chrome.storage.local.get(['extensionHistory'])
      if (result.extensionHistory) {
        setHistory(result.extensionHistory)
      }
    } catch (error) {
      console.error('Failed to load history:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const clearHistory = async () => {
    await chrome.storage.local.remove(['extensionHistory'])
    setHistory([])
  }
  
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }
  
  if (loading) {
    return <div className="text-center py-8">Loading history...</div>
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">History</h2>
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
      
      {history.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No history yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {history.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{item.title}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.url}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(item.timestamp)}
                    </p>
                  </div>
                  <Badge variant={item.type === 'summary' ? 'default' : 'secondary'}>
                    {item.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
```

Then add it to your popup:

```tsx
// In src/popup.tsx
import { HistoryView } from "./components/HistoryView"

// Update TabsList to include 4 columns
<TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
  <TabsTrigger value="summary">Summary</TabsTrigger>
  <TabsTrigger value="history">
    <Clock className="h-4 w-4 mr-2" />
    History
  </TabsTrigger>
  <TabsTrigger value="settings">Settings</TabsTrigger>
</TabsList>

// Add TabsContent
<TabsContent value="history" className="mt-0">
  <HistoryView />
</TabsContent>
```

This creates a complete history view that loads data from Chrome storage, displays it in a clean list format, and provides functionality to clear the history.