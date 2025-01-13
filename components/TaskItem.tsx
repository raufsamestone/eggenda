'use client'

import { useState } from 'react';
import { Task } from '@/types/task';
import { Draggable } from '@hello-pangea/dnd';
import { Check } from 'lucide-react';
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
              e.stopPropagation();
              setIsDetailOpen(true);
            }}
            className={`
              group relative mb-1 cursor-pointer
              rounded-xl py-1.5 px-3
              ${task.status === 'completed' ? 'opacity-60' : ''}
              ${task.color ? '' : 'dark:text-gray-400 dark:bg-gray-800 text-gray-900'}
              ${snapshot.isDragging ? 'ring-2 ring-primary ring-offset-2 shadow-lg scale-105' : ''}
              hover:bg-gray-100 dark:hover:bg-gray-700
              transition-all duration-200
              flex items-center justify-between gap-2
            `}
            style={{
              backgroundColor: task.color,
              transform: snapshot.isDragging ? 'rotate(2deg)' : undefined,
              ...provided.draggableProps.style
            }}
          >
            <span className={`
              text-sm truncate
              ${task.status === 'completed' ? 'line-through opacity-70' : ''}
            `}>
              {task.title}
            </span>

            {/* Checkbox - Hidden on desktop by default, visible on hover and mobile */}
            <button
              onClick={handleToggleComplete}
              className={`
                w-4 h-4 rounded-full border flex-shrink-0
                md:opacity-0 md:group-hover:opacity-100
                flex items-center justify-center
                ${task.status === 'completed' ? 'opacity-100' : ''}
                ${task.status === 'completed'
                  ? 'bg-black border-transparent dark:bg-white'
                  : 'border-gray-400 dark:border-gray-500 hover:border-gray-600 dark:hover:border-gray-400'
                }
                transition-all duration-200
              `}
            >
              {task.status === 'completed' && (
                <Check className="w-2.5 h-2.5 text-white dark:text-black stroke-[3]" />
              )}
            </button>
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