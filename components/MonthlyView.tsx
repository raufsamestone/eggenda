'use client'
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from 'date-fns';
import WeeklyGrid from './WeeklyGrid';

interface MonthlyViewProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => void;
  onCreateTask: (day: string, rowIndex: number, title: string) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
}

export default function MonthlyView({
  tasks,
  onTaskComplete,
  onCreateTask,
  onUpdateTask,
  onDeleteTask
}: MonthlyViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ←
        </button>
        <h2 className="text-xl font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          →
        </button>
      </div>

      <WeeklyGrid
        tasks={tasks.filter(task => {
          const taskDate = task.date ? new Date(task.date) : null;
          return taskDate && 
            taskDate >= monthStart && 
            taskDate <= monthEnd;
        })}
        onTaskComplete={onTaskComplete}
        onCreateTask={onCreateTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
      />
    </div>
  );
} 