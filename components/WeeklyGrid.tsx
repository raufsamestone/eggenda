'use client'

import { useState } from 'react';
import { format, startOfWeek, addDays, getWeek } from 'date-fns';
import { Task, TaskColor } from '@/types/task';
import { Droppable } from '@hello-pangea/dnd';
import { Plus, CalendarDays, Inbox, ArrowRight } from 'lucide-react';
import TaskItem from './TaskItem';
import CreateTaskDialog from './CreateTaskDialog';
import { Button } from '@/components/ui/button';

interface WeeklyGridProps {
  tasks: Task[];
  currentWeek: { weekNumber: number; startDate: Date };
  onCreateTask: (task: Partial<Task>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onWeekChange: (direction: 'prev' | 'next') => void;
  onToggleUnscheduled: () => void;
}

export default function WeeklyGrid({
  tasks,
  currentWeek,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onWeekChange,
  onToggleUnscheduled,
}: WeeklyGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Simplify week days calculation - always use the provided startDate
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeek.startDate);
    date.setDate(date.getDate() + i);
    return date;
  });

  const getTasksForDay = (date: Date) => {
    return tasks.filter(task => {
      if (!task.task_date) return false;
      
      // Normalize both dates to start of day for comparison
      const taskDate = new Date(task.task_date);
      taskDate.setHours(0, 0, 0, 0);
      
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      
      return taskDate.getTime() === compareDate.getTime();
    });
  };

  const handleCreateTask = async (title: string, description: string, color?: TaskColor) => {
    if (!selectedDate) return;

    // Ensure consistent date handling
    const taskDate = new Date(selectedDate);
    taskDate.setHours(0, 0, 0, 0);

    const newTask = {
      title,
      description,
      color,
      status: 'todo' as const,
      task_date: format(taskDate, 'yyyy-MM-dd'),
      week_number: getWeek(taskDate),
      year: taskDate.getFullYear(),
    };

    onCreateTask(newTask);
    setSelectedDate(null);
  };

  const handleTodayClick = () => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const currentWeekStart = currentWeek.startDate;
    const diffInDays = Math.round((todayWeekStart.getTime() - currentWeekStart.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays > 0) {
      for (let i = 0; i < Math.abs(diffInDays) / 7; i++) {
        onWeekChange('next');
      }
    } else if (diffInDays < 0) {
      for (let i = 0; i < Math.abs(diffInDays) / 7; i++) {
        onWeekChange('prev');
      }
    }
  };

  const isToday = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

  const handleMoveTasksToNextDay = (currentDate: Date) => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const uncompletedTasks = getTasksForDay(currentDate).filter(
      task => task.status === 'todo'
    );

    uncompletedTasks.forEach(task => {
      onUpdateTask(task.id, {
        task_date: format(nextDay, 'yyyy-MM-dd'),
        week_number: getWeek(nextDay),
        year: nextDay.getFullYear()
      });
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTodayClick}
            className="flex items-center gap-2 h-8 px-3 text-xs"
          >
            <CalendarDays className="w-3 h-3" />
            This Week
          </Button>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={onToggleUnscheduled}
            className="flex items-center gap-2"
          >
            <Inbox className="w-4 h-4" />
            Unscheduled
          </Button> */}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onWeekChange('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            ←
          </button>
          <h2 className="text-lg font-semibold">
            Week {currentWeek.weekNumber}
          </h2>
          <button
            onClick={() => onWeekChange('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map((date, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <h3 className={`text-sm font-medium ${isToday(date) ? 'text-primary' : ''}`}>
                  {format(date, 'EEE')}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveTasksToNextDay(date);
                  }}
                  className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                  title="Move uncompleted tasks to next day"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <span className={`text-sm ${isToday(date) ? 'text-primary' : 'text-gray-500'}`}>
                {format(date, 'd')}
              </span>
            </div>

            <Droppable droppableId={format(date, 'yyyy-MM-dd')}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`
                    min-h-[150px] relative group flex flex-col p-1
                    ${isToday(date) ? 'bg-primary/5 dark:bg-primary/10' : ''}
                    ${snapshot.isDraggingOver ? 'bg-gray-100 dark:bg-gray-800 ring-2 ring-primary ring-offset-2' : ''}
                    transition-all duration-200
                    ${format(date, 'E') === 'Sun' ? 'border border-dashed border-gray-200 dark:border-gray-700' : ''}
                  `}
                  onClick={(e) => {
                    if (e.currentTarget === e.target) {
                      setSelectedDate(date);
                    }
                  }}
                >
                  <div className="flex-1">
                    {getTasksForDay(date).map((task, index) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        index={index}
                        onUpdate={onUpdateTask}
                        onDelete={onDeleteTask}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                  
                  <button
                    className="w-full p-1 mt-1 rounded-md bg-gray-500/10 text-gray-500
                             flex items-center justify-center
                             hover:bg-gray-500/20 active:bg-gray-500/30
                             transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(date);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="text-xs">Add task</span>
                  </button>
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>

      <CreateTaskDialog
        open={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        onSubmit={handleCreateTask}
        date={selectedDate || new Date()}
      />
    </div>
  );
} 