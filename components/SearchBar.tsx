'use client'

import { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
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
      const filtered = tasks.filter(task => {
        const titleMatch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        const descriptionMatch = task.description && typeof task.description === 'string' ?
          task.description.toLowerCase().includes(searchQuery.toLowerCase()) :
          false;
        return titleMatch || descriptionMatch;
      });
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

  return (
    <>
      {/* Mobile Search Bar */}
      <div className="md:hidden relative w-full">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            onClick={() => setIsOpen(true)}
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsOpen(false);
              }}
              className="absolute right-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Desktop Search Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-2 text-sm bg-background border border-input rounded-lg hover:bg-accent"
      >
        <Search className="w-4 h-4" />
        <span>Search</span>
        <kbd className="ml-2 text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">⌘ F</kbd>
      </button>

      {/* Search Dialog */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-start justify-center pt-[20vh] z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-lg mx-4">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsOpen(false);
                  }}
                  className="p-1 hover:bg-accent rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {filteredTasks.length > 0 && (
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-border">
                {filteredTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 hover:bg-accent flex justify-between items-center cursor-pointer"
                    onClick={() => handleTaskClick(task)}
                  >
                    <span className="text-sm truncate">{task.title}</span>
                    <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                      {task.task_date ? format(new Date(task.task_date), 'd MMM') : 'No date'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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