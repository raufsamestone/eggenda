'use client'
import { useEffect, useRef, useState } from 'react';

interface NewTaskDialogProps {
  day: string;
  rowIndex: number;
  date?: string;
  week_number?: number;
  year?: number;
  onClose: () => void;
  onSubmit: (title: string) => void;
}

export default function NewTaskDialog({ day, rowIndex, date, week_number, year, onClose, onSubmit }: NewTaskDialogProps) {
  const [title, setTitle] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
      inputRef.current?.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onSubmit(title.trim());
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/50 rounded-lg p-0 w-full max-w-md"
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">New Task for {day}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="text-sm text-gray-500">Task Title</label>
            <input
              ref={inputRef}
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task title"
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            >
              Create Task
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
} 