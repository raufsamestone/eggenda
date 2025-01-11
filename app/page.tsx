'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { Task, TaskColor, TASK_COLORS } from '@/types/task';
import { createClientComponentClient } from '@/utils/supabase/client';
import { getWeek, startOfWeek, format } from 'date-fns';
import { debounce } from 'lodash';
import WeeklyGrid from '@/components/WeeklyGrid';
import TaskPool from '@/components/TaskPool';
import SearchBar from '@/components/SearchBar';
import DragDropProvider from '@/components/DragDropProvider';
import Calendar from '@/components/Calendar';

// Helper function to validate task color
const isValidTaskColor = (color: string | undefined): color is TaskColor => {
  if (!color) return true; // undefined is valid
  // Only accept exact hex color codes from TASK_COLORS
  return Object.values(TASK_COLORS).includes(color as TaskColor);
};

// Helper function to sanitize task color
const sanitizeTaskColor = (color: string | undefined): TaskColor | undefined => {
  if (!color) return undefined;
  return isValidTaskColor(color) ? (color as TaskColor) : undefined;
};

export default function Home() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    return {
      weekNumber: getWeek(now),
      startDate: startOfWeek(now, { weekStartsOn: 1 })
    };
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTaskPoolOpen, setIsTaskPoolOpen] = useState(false);

  const supabase = createClientComponentClient();

  // Fetch all tasks
  const fetchAllTasks = useCallback(async () => {
    try {
      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      setIsLoading(true);
      setError(null);

      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('id, title, description, status, task_date, week_number, year, color, row_index, created_at, updated_at, attachments')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion after validating the shape of the data
      const typedTasks = (tasks || []).map(task => {
        const color = task.color as string | undefined;
        if (color && !isValidTaskColor(color)) {
          console.warn(`Invalid task color: ${color}, resetting to default`);
        }

        return {
          id: task.id as string,
          title: task.title as string,
          description: task.description as string | undefined,
          status: task.status as Task['status'],
          task_date: task.task_date as string | null,
          week_number: task.week_number as number | null,
          year: task.year as number | null,
          color: sanitizeTaskColor(color),
          row_index: task.row_index as number | null,
          created_at: task.created_at as string,
          updated_at: task.updated_at as string,
          attachments: task.attachments as Array<{ name: string; url: string; }> | undefined
        } satisfies Task;
      });

      setAllTasks(typedTasks);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred while fetching tasks');
      }
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [supabase]);

  // Initial fetch of all tasks
  useEffect(() => {
    fetchAllTasks();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchAllTasks]);

  const handleCreateTask = async (task: Partial<Task>) => {
    const { data: newTaskData, error } = await supabase
      .from('tasks')
      .insert([task as Record<string, unknown>])
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return;
    }

    if (!newTaskData) {
      console.error('No data returned from task creation');
      return;
    }

    // Type assertion after validating the shape of the data
    const color = newTaskData.color as string | undefined;
    const newTask: Task = {
      id: newTaskData.id as string,
      title: newTaskData.title as string,
      description: newTaskData.description as string | undefined,
      status: newTaskData.status as Task['status'],
      task_date: newTaskData.task_date as string | null,
      week_number: newTaskData.week_number as number | null,
      year: newTaskData.year as number | null,
      color: sanitizeTaskColor(color),
      row_index: newTaskData.row_index as number | null,
      created_at: newTaskData.created_at as string,
      updated_at: newTaskData.updated_at as string
    };

    setAllTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates as Record<string, unknown>)
      .eq('id', id);

    if (error) {
      console.error('Error updating task:', error);
      return;
    }

    setAllTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, ...updates } : task
      )
    );
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return;
    }

    setAllTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev.startDate);
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
      
      return {
        weekNumber: getWeek(newDate),
        startDate: startOfWeek(newDate, { weekStartsOn: 1 })
      };
    });
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentWeek({
      weekNumber: getWeek(today),
      startDate: startOfWeek(today, { weekStartsOn: 1 })
    });
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceId = result.draggableId;
    const destinationDate = result.destination.droppableId;
    const sourceTask = allTasks.find(t => t.id === sourceId);

    if (!sourceTask) return;

    const updates = {
      task_date: destinationDate === 'task-pool' ? null : destinationDate,
      week_number: destinationDate === 'task-pool' ? null : getWeek(new Date(destinationDate)),
      year: destinationDate === 'task-pool' ? null : new Date(destinationDate).getFullYear()
    };

    await handleUpdateTask(sourceId, updates);
  };

  // Filter tasks based on search query and current week
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    if (!matchesSearch) return false;

    if (!task.task_date) return false; // Exclude unscheduled tasks

    return (
      task.week_number === currentWeek.weekNumber &&
      task.year === currentWeek.startDate.getFullYear()
    );
  });

  // Filter unscheduled tasks
  const filteredUnscheduledTasks = allTasks.filter(task => {
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    return matchesSearch && !task.task_date;
  });

  const handleDateSelect = (date: Date) => {
    setCurrentWeek({
      weekNumber: getWeek(date),
      startDate: startOfWeek(date, { weekStartsOn: 1 })
    });
    setIsCalendarOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + N to create new task
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        const today = new Date();
        const newTask: Partial<Task> = {
          title: '',
          status: 'todo' as const,
          task_date: format(today, 'yyyy-MM-dd'),
          week_number: getWeek(today),
          year: today.getFullYear(),
          row_index: 0
        };
        handleCreateTask(newTask);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCreateTask]);

  return (
    <main className="container mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setIsCalendarOpen(true)}
          className="text-2xl font-bold hover:text-primary transition-colors"
        >
          {format(currentWeek.startDate, 'MMMM yyyy')}
        </button>
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          tasks={allTasks}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>

      {isCalendarOpen && (
        <Calendar
          tasks={allTasks}
          currentDate={currentWeek.startDate}
          onDateSelect={handleDateSelect}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}

      <DragDropProvider onDragEnd={handleDragEnd}>
        <div className="space-y-8">
          <WeeklyGrid
            tasks={filteredTasks}
            currentWeek={currentWeek}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onWeekChange={handleWeekChange}
            onToggleUnscheduled={() => setIsTaskPoolOpen(prev => !prev)}
          />

          <TaskPool
            tasks={filteredUnscheduledTasks}
            onUpdateTask={handleUpdateTask}
            onDelete={handleDeleteTask}
            isOpen={isTaskPoolOpen}
            onClose={() => setIsTaskPoolOpen(false)}
          />
        </div>
      </DragDropProvider>
    </main>
  );
}
