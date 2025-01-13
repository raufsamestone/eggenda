'use client'

import { useEffect, useState, useCallback } from 'react'
import { Task } from '@/types/task'
import { ExternalLink } from 'lucide-react'

interface TaskUrlTitleProps {
  task: Task
  onUpdate: (id: string, updates: Partial<Task>) => void
}

export default function TaskUrlTitle({ task, onUpdate }: TaskUrlTitleProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000

  const isValidUrl = useCallback((text: string) => {
    try {
      const url = new URL(text)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }, [])

  const isOnlyUrl = useCallback((text: string) => {
    const trimmed = text.trim()
    return isValidUrl(trimmed) && !trimmed.includes(' ')
  }, [isValidUrl])

  const isRecentTask = useCallback((createdAt: string) => {
    const taskDate = new Date(createdAt)
    const now = new Date()
    const threeSecondsAgo = new Date(now.getTime() - 3000)
    return taskDate > threeSecondsAgo
  }, [])

  const fetchUrlTitle = useCallback(async () => {
    try {
      // Only proceed if conditions are met
      if (
        !isRecentTask(task.created_at) || 
        !isOnlyUrl(task.title) || 
        task.metadata?.urlTitle
      ) {
        return
      }

      setIsLoading(true)
      
      const response = await fetch(`/api/fetch-url-title?url=${encodeURIComponent(task.title)}`)
      
      if (response.status === 429) {
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1)
          }, RETRY_DELAY * (retryCount + 1))
          return
        }
        throw new Error('Rate limit exceeded')
      }

      const data = await response.json()
      
      if (data.title) {
        // Store the fetched title in metadata instead of replacing the task title
        onUpdate(task.id, {
          metadata: {
            ...task.metadata,
            urlTitle: data.title,
            originalUrl: task.title,
            urlFetchedAt: new Date().toISOString()
          }
        })
      }
    } catch (e) {
      console.error('Error fetching URL title:', e)
    } finally {
      setIsLoading(false)
    }
  }, [
    task.id,
    task.title,
    task.created_at,
    task.metadata,
    onUpdate,
    retryCount,
    isOnlyUrl,
    isRecentTask
  ])

  useEffect(() => {
    if (retryCount < MAX_RETRIES) {
      fetchUrlTitle()
    }
  }, [fetchUrlTitle, retryCount])

  // If it's a URL task, show URL and fetched title
  if (isValidUrl(task.title)) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-1 text-sm">
          <ExternalLink className="w-3 h-3" />
          <a 
            href={task.title}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline truncate"
            onClick={(e) => e.stopPropagation()}
          >
            {task.title}
          </a>
        </div>
        {task.metadata?.urlTitle && (
          <div className="text-xs text-muted-foreground truncate pl-4">
            {task.metadata.urlTitle}
          </div>
        )}
        {isLoading && (
          <div className="text-xs text-muted-foreground truncate pl-4">
            Loading title...
          </div>
        )}
      </div>
    )
  }

  // If it's not a URL, just show the regular title
  return (
    <span className="text-sm truncate">
      {task.title}
    </span>
  )
} 