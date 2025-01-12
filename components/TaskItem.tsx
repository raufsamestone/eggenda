'use client'

import { useState } from 'react';
import { Task } from '@/types/task';
import { Draggable } from '@hello-pangea/dnd';
import TaskDetailDialog from './TaskDetailDialog';

interface TaskItemProps {
  task: Task;
  index: number;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

export default function TaskItem({ task, index, onUpdate, onDelete }: TaskItemProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(task.id, {
      status: task.status === 'completed' ? 'todo' : 'completed'
    });
  };

  return (
    <>
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={(e) => {
              e.stopPropagation(); // Prevent create dialog
              setIsDetailOpen(true);
            }}
            className={`
              rounded-xl group relative py-1 px-2 mb-1 cursor-pointer
              ${task.status === 'completed' ? 'opacity-60' : ''}
              ${task.color ? 'text-gray-900' : 'text-gray-900 dark:text-gray-100'}
              ${snapshot.isDragging ? 'ring-2 ring-primary ring-offset-2 shadow-lg scale-105' : ''}
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-all duration-200
              flex items-center gap-2
            `}
            style={{
              backgroundColor: task.color || "rgb(244 244 244)",
              transform: snapshot.isDragging ? 'rotate(2deg)' : undefined,
              ...provided.draggableProps.style
            }}
          >
            <button
              onClick={handleToggleComplete}
              className={`
                w-3 h-3 rounded-sm border flex-shrink-0
                opacity-0 group-hover:opacity-100
                ${task.status === 'completed' ? 'opacity-100' : ''}
                ${task.status === 'completed' 
                  ? 'bg-white/20 border-white/40'
                  : 'border-gray-400 dark:border-gray-500 hover:border-primary dark:hover:border-primary'
                }
                transition-all duration-200
              `}
            >
              {task.status === 'completed' && (
                <svg 
                  className="w-3 h-3 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M5 13l4 4L19 7" 
                  />
                </svg>
              )}
            </button>

            <span className={`
              text-sm truncate
              ${task.status === 'completed' ? 'line-through opacity-70' : ''}
            `}>
              {task.title}
            </span>
          </div>
        )}
      </Draggable>

      <TaskDetailDialog
        task={task}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </>
  );
} 