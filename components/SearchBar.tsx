'use client'

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Task } from '@/types/task';
import { format } from 'date-fns';
import TaskDetailDialog from './TaskDetailDialog';

interface SearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  tasks: Task[];
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
}

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  tasks,
  onUpdateTask,
  onDeleteTask
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setSearchQuery]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = tasks.filter(task => 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      );
      setFilteredTasks(filtered);
    } else {
      setFilteredTasks([]);
    }
  }, [searchQuery, tasks]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleCloseDialog = () => {
    setSelectedTask(null);
    setIsOpen(false);
    setSearchQuery('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[20vh] z-50">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="flex-1 bg-transparent border-none outline-none text-lg"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsOpen(false);
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {filteredTasks.length > 0 && (
            <div className="max-h-[60vh] overflow-y-auto">
              {filteredTasks.map(task => (
                <div
                  key={task.id}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 flex justify-between items-center cursor-pointer"
                  onClick={() => handleTaskClick(task)}
                >
                  <span>{task.title}</span>
                  <span className="text-sm text-gray-500">
                    {task.task_date ? format(new Date(task.task_date), 'd MMM') : 'No date'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={true}
          onClose={handleCloseDialog}
          onUpdate={onUpdateTask}
          onDelete={onDeleteTask}
        />
      )}
    </>
  );
} 