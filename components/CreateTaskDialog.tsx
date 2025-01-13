'use client'

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import { format } from 'date-fns'
import { TaskColor, TASK_COLORS } from '@/types/task'

interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (title: string, description: string, color?: TaskColor) => Promise<void>
  date: Date
}

export default function CreateTaskDialog({
  open,
  onClose,
  onSubmit,
  date,
}: CreateTaskDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState<TaskColor | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      await onSubmit(title.trim(), description.trim(), color)
      setTitle('')
      setDescription('')
      setColor(undefined)
      onClose()
    } catch (error) {
      console.error('Error creating task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Command/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
    // Escape to close
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Add task for {format(date, 'EEEE, MMMM d')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" onKeyDown={handleKeyDown}>
          <Input
            ref={inputRef}
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-3"
          />
          
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3"
          />

          <div className="flex gap-2">
            {Object.entries(TASK_COLORS).map(([name, value]) => (
              <button
                key={name}
                type="button"
                onClick={() => setColor(value)}
                className={`w-6 h-6 rounded-full transition-all ${
                  color === value ? 'ring-2 ring-offset-2 ring-primary' : ''
                }`}
                style={{ backgroundColor: value }}
              />
            ))}
            {color && (
              <button
                type="button"
                onClick={() => setColor(undefined)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!title.trim() || isSubmitting}
            >
              Add task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 