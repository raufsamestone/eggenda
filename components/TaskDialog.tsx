'use client'
import { useEffect, useState } from 'react';
import { Task } from '@/types/task';

const COLORS = [
  { name: 'Default', value: 'bg-white' },
  { name: 'Red', value: 'bg-red-50' },
  { name: 'Blue', value: 'bg-blue-50' },
  { name: 'Green', value: 'bg-green-50' },
  { name: 'Yellow', value: 'bg-yellow-50' },
  { name: 'Purple', value: 'bg-purple-50' },
];

interface TaskDialogProps {
  task: Task | null;
  onClose: () => void;
  onUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskDialog({ task, onClose, onUpdate, onDelete }: TaskDialogProps) {
  const [description, setDescription] = useState(task?.description || '');
  const [color, setColor] = useState(task?.color || 'bg-white');
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
      setColor(task.color || 'bg-white');
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md m-4 rounded-lg shadow-lg ${color}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">{task.title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-500">Color</label>
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
                      ${color === c.value ? 'border-blue-500 scale-110' : 'border-gray-200'}
                    `}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Description</label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setIsEdited(true);
                }}
                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="Add a description..."
              />
            </div>

            <div>
              <label className="text-sm text-gray-500">Status</label>
              <div className="mt-1">
                <span className={`
                  inline-block px-2 py-1 text-xs rounded-full
                  ${task.status === 'completed' ? 'bg-green-100 text-green-800' :
                    task.status === 'todo' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'}
                `}>
                  {task.status}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-500">Day</label>
              <p className="mt-1">{task.status || 'Unassigned'}</p>
            </div>

            <div className="flex justify-between pt-4 border-t">
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
              >
                Delete Task
              </button>
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={!isEdited}
                  className={`
                    px-4 py-2 text-sm text-white rounded-lg
                    ${isEdited
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'bg-gray-300 cursor-not-allowed'}
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