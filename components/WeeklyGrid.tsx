"use client";

import { useState, useCallback, useEffect } from "react";
import { format, startOfWeek, getWeek } from "date-fns";
import { Droppable } from "@hello-pangea/dnd";
import { Plus, CalendarDays, ArrowRight, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskItem from "./TaskItem";
import CreateTaskDialog from "./CreateTaskDialog";
import type { Task, TaskColor } from "@/types/task";
import SettingsDialog from "./SettingsDialog";
import { useSettings } from "@/hooks/useSettings";
import { UserSettings } from "@/types/settings";

interface WeeklyGridProps {
  tasks: Task[];
  currentWeek: {
    weekNumber: number;
    startDate: Date;
  };
  onCreateTask: (task: Partial<Task>) => void;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onWeekChange: (direction: "prev" | "next") => void;
  onToggleUnscheduled: () => void;
}

interface TaskUpdate {
  task_date: string;
  week_number: number;
  year: number;
}

export default function WeeklyGrid({
  tasks,
  currentWeek,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onWeekChange,
}: WeeklyGridProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { settings, updateSetting } = useSettings();

  // Use settings from the hook
  const weekDays = useCallback(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(currentWeek.startDate);
      const day = new Date(date.setDate(date.getDate() + i));
      return day;
    }).filter((date) => {
      const dayName = format(date, "E"); // Gets short day name (Mon, Tue, etc.)
      return settings.workDays.includes(dayName);
    });
  }, [currentWeek.startDate, settings.workDays]);

  const getTasksForDay = useCallback(
    (date: Date): Task[] => {
      return tasks.filter((task) => {
        if (!task.task_date) return false;

        const taskDate = new Date(task.task_date);
        const compareDate = new Date(date);

        // Normalize dates for comparison
        return (
          format(taskDate, "yyyy-MM-dd") === format(compareDate, "yyyy-MM-dd")
        );
      });
    },
    [tasks]
  );

  const handleCreateTask = async (
    title: string,
    description: string,
    color?: TaskColor
  ): Promise<void> => {
    if (!selectedDate) return;

    const taskDate = new Date(selectedDate);
    const newTask: Partial<Task> = {
      title,
      description,
      color,
      status: "todo" as const,
      task_date: format(taskDate, "yyyy-MM-dd"),
      week_number: getWeek(taskDate),
      year: taskDate.getFullYear(),
    };

    onCreateTask(newTask);
    setSelectedDate(null);
  };

  const handleTodayClick = useCallback(() => {
    const today = new Date();
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const currentWeekStart = currentWeek.startDate;
    const diffInWeeks = Math.round(
      (todayWeekStart.getTime() - currentWeekStart.getTime()) /
        (1000 * 60 * 60 * 24 * 7)
    );

    if (diffInWeeks !== 0) {
      const direction = diffInWeeks > 0 ? "next" : "prev";
      for (let i = 0; i < Math.abs(diffInWeeks); i++) {
        onWeekChange(direction);
      }
    }
  }, [currentWeek.startDate, onWeekChange]);

  const handleMoveTasksToNextDay = async (currentDate: Date): Promise<void> => {
    try {
      const cleanCurrentDate = new Date(format(currentDate, "yyyy-MM-dd"));
      const nextDay = new Date(cleanCurrentDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // Get all tasks for the current day that are NOT completed
      const tasksToMove = getTasksForDay(currentDate).filter(
        (task) => task.status !== "completed"
      );

      if (tasksToMove.length === 0) return;

      const updatePromises = tasksToMove.map((task) => {
        const updates: TaskUpdate = {
          task_date: format(nextDay, "yyyy-MM-dd"),
          week_number: getWeek(nextDay),
          year: nextDay.getFullYear(),
        };

        return onUpdateTask(task.id, updates);
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error moving tasks to next day:", error);
      throw new Error("Failed to move tasks to next day");
    }
  };

  const isToday = useCallback((date: Date): boolean => {
    return format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  }, []);

  // const getGridColumns = (length: number) => {
  //   const columns = {
  //     1: "grid-cols-1 md:grid-cols-1",
  //     2: "grid-cols-1 md:grid-cols-2",
  //     3: "grid-cols-1 md:grid-cols-3",
  //     4: "grid-cols-1 md:grid-cols-4",
  //     5: "grid-cols-1 md:grid-cols-5",
  //     6: "grid-cols-1 md:grid-cols-6",
  //     7: "grid-cols-1 md:grid-cols-7",
  //   };
  //   return (
  //     columns[length as keyof typeof columns] || "grid-cols-1 md:grid-cols-7"
  //   );
  // };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + Enter to create task for today
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        const today = new Date();
        setSelectedDate(today);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(new Date())}
            className="flex items-center gap-2 h-8 px-3 text-xs"
          >
            <Plus className="w-3 h-3" />
            Add for today
            <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>Enter
            </kbd>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onWeekChange("prev")}
            className="p-2"
          >
            ←
          </Button>
          <h2 className="text-lg font-semibold">
            Week {currentWeek.weekNumber}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onWeekChange("next")}
            className="p-2"
          >
            →
          </Button>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 md:${
          {
            "1": "grid-cols-1",
            "2": "grid-cols-2",
            "3": "grid-cols-3",
            "4": "grid-cols-4",
            "5": "grid-cols-5",
            "6": "grid-cols-6",
            "7": "grid-cols-7",
          }[settings.workDays.length]
        } gap-4`}
      >
        {weekDays().map((date, index) => (
          <div key={format(date, "yyyy-MM-dd")} className="space-y-1">
            <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-1">
                <h3
                  className={`text-sm font-medium ${
                    isToday(date) ? "text-primary" : ""
                  }`}
                >
                  {format(date, "EEE")}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveTasksToNextDay(date);
                  }}
                  className="p-1"
                  title="Move uncompleted tasks to next day"
                >
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
              <span
                className={`text-sm ${
                  isToday(date) ? "text-primary" : "text-gray-500"
                }`}
              >
                {format(date, "d")}
              </span>
            </div>

            <Droppable droppableId={format(date, "yyyy-MM-dd")}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  // TODO: Add a class for today's date from settings
                  className={`
                    min-h-[150px] relative group flex flex-col p-1
                    ${isToday(date) ? "" : ""} 
                    ${
                      snapshot.isDraggingOver
                        ? "bg-gray-100 dark:bg-gray-800 ring-2 ring-primary ring-offset-2"
                        : ""
                    }
                    transition-all duration-200
                    ${
                      format(date, "E") === "Sun"
                        ? "border border-dashed border-gray-200 dark:border-gray-700"
                        : ""
                    }
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

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-1 opacity-10 group-hover:opacity-80  border-transparent hover:border-gray-300 dark:hover:border-gray-600 bg-gray-100 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDate(date);
                    }}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    <span className="text-xs">Add task</span>
                  </Button>
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

      <SettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          // Update each setting individually
          Object.entries(newSettings).forEach(([key, value]) => {
            updateSetting(key as keyof UserSettings["preferences"], value);
          });
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
}
