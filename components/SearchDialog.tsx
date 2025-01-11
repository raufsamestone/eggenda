'use client'
import { useEffect, useState, useRef } from 'react';
import { Task } from '@/types/task';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  searchQuery: string;
  onTaskClick: (task: Task) => void;
}

export default function SearchDialog({ isOpen, onClose, tasks, searchQuery, onTaskClick }: SearchDialogProps) {
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filtered = tasks.filter(task => 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTasks(filtered);
  }, [tasks, searchQuery]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
      <div 
        ref={dialogRef}
        className="bg-white rounded-lg w-full max-w-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Search Results</h2>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No tasks found
            </div>
          ) : (
            <div className="divide-y">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    onTaskClick(task);
                    onClose();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`
                      w-2 h-2 rounded-full
                      ${task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in-progress' ? 'bg-blue-500' :
                        'bg-gray-500'}
                    `} />
                    <h3 className="font-medium">{task.title}</h3>
                    <span className="text-sm text-gray-500">{task.label || 'Unassigned'}</span>
                  </div>
                  {task.description && (
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 