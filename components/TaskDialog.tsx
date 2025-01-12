'use client'
import { useEffect, useState } from 'react';
import { Task } from '@/types/task';

const COLORS = [
  { name: 'Default', value: 'bg-background' },
  { name: 'Red', value: 'bg-red-50 dark:bg-red-900/30' },
  { name: 'Blue', value: 'bg-blue-50 dark:bg-blue-900/30' },
  { name: 'Green', value: 'bg-green-50 dark:bg-green-900/30' },
  { name: 'Yellow', value: 'bg-yellow-50 dark:bg-yellow-900/30' },
  { name: 'Purple', value: 'bg-purple-50 dark:bg-purple-900/30' },
];

interface TaskDialogProps {
  task: Task | null;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskDialog({ task, onClose, onUpdate, onDelete }: TaskDialogProps) {
  const [description, setDescription] = useState(task?.description || '');
  const [color, setColor] = useState(task?.color || 'bg-background');
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (task) {
      setDescription(task.description || '');
      setColor(task.color || 'bg-background');
      setIsEdited(false);
    }
  }, [task]);

  const handleUpdate = () => {
    console.log('handleUpdate', task, description, color);
    if (task && onUpdate) {
      onUpdate(task.id!, {
        description,
        status: 'todo',
        color: color as Task['color']
      });
      setIsEdited(false);
    } else {
      console.error('Update function not available or task is null');
    }
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id!);
      onClose();
    } else {
      console.error('Delete function not available or task is null');
    }
  };

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md m-4 rounded-lg shadow-lg ${color} dark:text-gray-100`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold dark:text-gray-100">{task.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Color</label>
              <div className="mt-2 flex gap-2">
                {COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setColor(c.value);
                      setIsEdited(true);
                    }}
                    className={`
                      w-6 h-6 rounded-full border-2 transition-all
                      ${c.value}
                      ${color === c.value ? 'border-blue-500 dark:border-blue-400 scale-110' : 'border-gray-200 dark:border-gray-700'}
                    `}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Description</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsEdited(true);
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-800 dark:text-gray-100"
                rows={4}
                placeholder="Add a description..."
              />
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Status</label>
              <div className="mt-1">
                <span className={`
                  inline-block px-2 py-1 text-xs rounded-full
                  ${task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                    task.status === 'todo' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}
                `}>
                  {task.status}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400">Day</label>
              <p className="mt-1 dark:text-gray-300">{task.status || 'Unassigned'}</p>
            </div>

            <div className="flex justify-between pt-4 border-t dark:border-gray-700">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30"
              >
                Delete Task
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!isEdited}
                  className={`
                    px-4 py-2 text-sm text-white rounded-lg
                    ${isEdited
                      ? 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700'
                      : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}
                  `}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 