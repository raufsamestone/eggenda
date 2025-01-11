'use client';

import { useState } from 'react';
import { Task } from '@/types/task';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarProps {
  tasks: Task[];
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onClose: () => void;
}

export default function Calendar({ tasks, currentDate, onDateSelect, onClose }: CalendarProps) {
  const [viewDate, setViewDate] = useState(currentDate);

  const days = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate)
  });

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.task_date) return false;
      return isSameDay(new Date(task.task_date), date);
    });
  };

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 shadow-lg z-50">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Calendar</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setViewDate(prev => subMonths(prev, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-medium">
            {format(viewDate, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setViewDate(prev => addMonths(prev, 1))}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="text-gray-500 font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() - 1 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {days.map(day => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, viewDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateSelect(day)}
                className={`
                  aspect-square p-1 relative group
                  hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg
                  ${!isCurrentMonth && 'opacity-30'}
                  ${isToday && 'ring-2 ring-primary'}
                `}
              >
                <span className={`
                  text-sm
                  ${isToday ? 'text-primary font-medium' : ''}
                `}>
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: task.color || '#6366f1' }}
                      />
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="w-1 h-1 rounded-full bg-gray-400" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
} 