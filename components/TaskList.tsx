'use client'

import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import TaskItem from './TaskItem';
import { Task } from '@/types/task';

interface TaskListProps {
  tasks: Task[];
  onDragEnd: (result: DropResult) => void;
  onComplete?: (taskId: string) => void;
}

export default function TaskList({ tasks, onDragEnd, onComplete }: TaskListProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="task-list">
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2"
          >
            {tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                onComplete={onComplete}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
} 