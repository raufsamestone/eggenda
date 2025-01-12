'use client'

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { TASK_COLORS, TaskColor } from '@/types/task';

interface CreateTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, color?: TaskColor) => void;
  date: Date;
}

export default function CreateTaskDialog({ open, onClose, onSubmit, date }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<TaskColor | undefined>(undefined);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit(title, description, selectedColor);
    setTitle('');
    setDescription('');
    setSelectedColor(undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Create Task for {date.toLocaleDateString()}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">
              Title
            </h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (title.trim()) {
                    handleSubmit();
                  }
                }
              }}
              className="w-full px-3 py-2 border rounded-md border-gray-200 dark:border-gray-700 
                       bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                       focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">
              Description
            </h3>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-sm text-gray-500 dark:text-gray-400">
              Color
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TASK_COLORS).map(([name, color]) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color as TaskColor)}
                  className={`
                    w-8 h-8 rounded-full
                    ${selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}
                    transition-all
                  `}
                  style={{ backgroundColor: color }}
                  title={name}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-gray-900 text-white hover:bg-gray-800" onClick={handleSubmit} disabled={!title.trim()}>
            Create Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 