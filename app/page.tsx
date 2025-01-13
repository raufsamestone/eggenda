"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Task, TaskColor, TASK_COLORS } from "@/types/task";
import { supabase } from "@/utils/supabase/client";
import { getWeek, startOfWeek, format } from "date-fns";
import { debounce } from "lodash";
import WeeklyGrid from "@/components/WeeklyGrid";
import TaskPool from "@/components/TaskPool";
import SearchBar from "@/components/SearchBar";
import DragDropProvider from "@/components/DragDropProvider";
import Calendar from "@/components/Calendar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AuthSession } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  Archive,
  LogOut,
  User,
  MoreHorizontal,
  Loader2,
  ListTodoIcon,
  Settings,
  Printer,
} from "lucide-react";
import SettingsDialog from "@/components/SettingsDialog";
import { useSettings } from "@/hooks/useSettings";
import { UserSettings } from "@/types/settings";

// Helper function to validate task color
const isValidTaskColor = (color: string | undefined): color is TaskColor => {
  if (!color) return true; // undefined is valid
  // Only accept exact hex color codes from TASK_COLORS
  return Object.values(TASK_COLORS).includes(color as TaskColor);
};

// Helper function to sanitize task color
const sanitizeTaskColor = (
  color: string | undefined
): TaskColor | undefined => {
  if (!color) return undefined;
  return isValidTaskColor(color) ? (color as TaskColor) : undefined;
};

export default function Home() {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { settings, updateSetting } = useSettings();
  const router = useRouter();
  const { toast } = useToast();

  const [currentWeek, setCurrentWeek] = useState(() => {
    const now = new Date();
    return {
      weekNumber: getWeek(now),
      startDate: startOfWeek(now, { weekStartsOn: 1 }),
    };
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTaskPoolOpen, setIsTaskPoolOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: string, session: AuthSession | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      return;
    }
    router.push("/auth/sign-in");
    router.refresh();
  };

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
        .from("tasks")
        .select(
          "id, title, description, status, task_date, week_number, year, color, row_index, created_at, updated_at, user_id, attachments, metadata"
        )
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Type assertion after validating the shape of the data
      const typedTasks = (tasks || []).map((task) => {
        const color = task.color as string | undefined;
        if (color && !isValidTaskColor(color)) {
          console.warn(`Invalid task color: ${color}, resetting to default`);
        }

        return {
          id: task.id as string,
          title: task.title as string,
          description: task.description as string | undefined,
          status: task.status as Task["status"],
          task_date: task.task_date as string | null,
          week_number: task.week_number as number | null,
          year: task.year as number | null,
          color: sanitizeTaskColor(color),
          row_index: task.row_index as number | null,
          created_at: task.created_at as string,
          updated_at: task.updated_at as string,
          //@ts-ignore
          user_id: task.user_id as string,
          attachments: task.attachments as
            | Array<{ name: string; url: string }>
            | undefined,
        };
      });
      //@ts-ignore
      setAllTasks(typedTasks);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while fetching tasks");
      }
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

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
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to create tasks",
          variant: "destructive",
        });
        return;
      }

      const { data: newTaskData, error } = await supabase
        .from("tasks")
        .insert([{ ...task, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error("Error creating task:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to create task",
          variant: "destructive",
        });
        return;
      }

      if (!newTaskData) {
        console.error("No data returned from task creation");
        return;
      }

      // Type assertion after validating the shape of the data
      const color = newTaskData.color as string | undefined;
      const newTask: Task = {
        id: newTaskData.id as string,
        title: newTaskData.title as string,
        description: newTaskData.description as string | undefined,
        status: newTaskData.status as Task["status"],
        task_date: newTaskData.task_date as string | null,
        week_number: newTaskData.week_number as number | null,
        year: newTaskData.year as number | null,
        color: sanitizeTaskColor(color),
        row_index: newTaskData.row_index as number | null,
        created_at: newTaskData.created_at as string,
        updated_at: newTaskData.updated_at as string,
        user_id: newTaskData.user_id as string,
      };

      setAllTasks((prev) => [{ ...newTask, isNewTask: true }, ...prev]);

      setTimeout(() => {
        setAllTasks((prev) =>
          prev.map((t) =>
            t.id === newTask.id ? { ...t, isNewTask: false } : t
          )
        );
      }, 5000);
    } catch (error: any) {
      console.error("Error creating task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to update task",
          variant: "destructive",
        });
        return;
      }

      // If the task was archived, remove it from the local state
      if (updates.status === "archived") {
        setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
      } else {
        // Otherwise update the task in the local state
        setAllTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, ...updates } : task
          )
        );
      }

      if (updates.status === "archived") {
        toast({
          title: "Task Archived",
          description: "The task has been moved to the archive",
        });
      }
    } catch (error: any) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      return;
    }

    setAllTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeek((prev) => {
      const newDate = new Date(prev.startDate);
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));

      return {
        weekNumber: getWeek(newDate),
        startDate: startOfWeek(newDate, { weekStartsOn: 1 }),
      };
    });
  };

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentWeek({
      weekNumber: getWeek(today),
      startDate: startOfWeek(today, { weekStartsOn: 1 }),
    });
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const sourceId = result.draggableId;
    const destinationDate = result.destination.droppableId;
    const sourceTask = allTasks.find((t) => t.id === sourceId);

    if (!sourceTask) return;

    const updates = {
      task_date: destinationDate === "task-pool" ? null : destinationDate,
      week_number:
        destinationDate === "task-pool"
          ? null
          : getWeek(new Date(destinationDate)),
      year:
        destinationDate === "task-pool"
          ? null
          : new Date(destinationDate).getFullYear(),
    };

    await handleUpdateTask(sourceId, updates);
  };

  // Filter tasks based on search query and current week
  const filteredTasks = allTasks.filter((task) => {
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && typeof task.description === "string"
        ? task.description.toLowerCase().includes(searchQuery.toLowerCase())
        : false);

    if (!matchesSearch) return false;
    if (!task.task_date) return false; // Exclude unscheduled tasks

    // Get the task's date and the week's date range
    const taskDate = new Date(task.task_date);
    taskDate.setHours(0, 0, 0, 0); // Normalize time to start of day

    const weekStart = new Date(currentWeek.startDate);
    weekStart.setHours(0, 0, 0, 0); // Normalize time to start of day

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999); // Set to end of day

    // Check if the task date falls within the current week's range (inclusive)
    return taskDate >= weekStart && taskDate <= weekEnd;
  });

  // Filter unscheduled tasks
  const filteredUnscheduledTasks = allTasks.filter((task) => {
    const matchesSearch =
      searchQuery === "" ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && typeof task.description === "string"
        ? task.description.toLowerCase().includes(searchQuery.toLowerCase())
        : false);

    return matchesSearch && !task.task_date;
  });

  const handleDateSelect = (date: Date) => {
    setCurrentWeek({
      weekNumber: getWeek(date),
      startDate: startOfWeek(date, { weekStartsOn: 1 }),
    });
    setIsCalendarOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + N to create new task
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        const today = new Date();
        const newTask: Partial<Task> = {
          title: "",
          status: "todo" as const,
          task_date: format(today, "yyyy-MM-dd"),
          week_number: getWeek(today),
          year: today.getFullYear(),
          row_index: 0,
        };
        handleCreateTask(newTask);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCreateTask]);

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
  
    // Get all tasks for the current week
    const startDate = currentWeek.startDate;
    const weekTasks = new Map();
    
    // Group tasks by day
    filteredTasks.forEach(task => {
      const dayKey = task.task_date || '';
      if (!weekTasks.has(dayKey)) {
        weekTasks.set(dayKey, []);
      }
      weekTasks.get(dayKey).push(task);
    });
  
    // Create print-friendly styles
    const printStyles = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        @page {
          size: landscape;
          margin: 1cm;
        }
        
        body {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 20px;
          color: #000;
        }
        
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #eee;
        }
        
        .week-grid {
          display: grid;
          grid-template-columns: repeat(${settings.workDays.length}, 1fr);
          gap: 16px;
          page-break-inside: avoid;
        }
        
        .day-column {
          break-inside: avoid;
        }
        
        .day-header {
          font-weight: 600;
          padding: 8px 0;
          margin-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .task-item {
          padding: 8px 12px;
          margin: 8px 0;
          border-radius: 6px;
          background-color: #fff;
          border: 1px solid #e5e7eb;
          font-size: 12px;
          page-break-inside: avoid;
        }
        
        .task-completed {
          opacity: 0.6;
          text-decoration: line-through;
        }
  
        .color-indicator {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .task-item { break-inside: avoid; }
        }
      </style>
    `;
  
    // Generate week days HTML
    const weekDaysHtml = settings.workDays.map(day => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + settings.workDays.indexOf(day));
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = weekTasks.get(dateStr) || [];
      //@ts-ignore
      const tasksHtml = dayTasks.map(task => `
        <div class="task-item ${task.status === 'completed' ? 'task-completed' : ''}" 
             style="${task.color ? `border-left: 3px solid ${task.color};` : ''}">
          ${task.color ? `<span class="color-indicator" style="background-color: ${task.color};"></span>` : ''}
          ${task.title}
        </div>
      `).join('');
  
      return `
        <div class="day-column">
          <div class="day-header">
            <span>${format(date, 'EEE')}</span>
            <span>${format(date, 'd')}</span>
          </div>
          <div class="day-content">
            ${tasksHtml}
          </div>
        </div>
      `;
    }).join('');
  
    // Set the content of the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Weekly Tasks - ${format(currentWeek.startDate, 'MMM d, yyyy')}</title>
          ${printStyles}
        </head>
        <body>
          <div class="header">
            <h1>Week ${currentWeek.weekNumber} - ${format(currentWeek.startDate, 'MMMM d, yyyy')}</h1>
          </div>
          <div class="week-grid">
            ${weekDaysHtml}
          </div>
        </body>
      </html>
    `);
  
    printWindow.document.close();
    
    // Print after images and styles are loaded
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <main className="w-full mx-auto p-6 space-y-8">
      {isLoading ? (
        <div className="fixed inset-0 bg-background flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="text-4xl animate-bounce">🍳</div>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Cooking up your tasks...
              </span>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="text-2xl font-bold transition-colors"
            >
              {format(currentWeek.startDate, "MMMM yyyy")}
            </button>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <SearchBar
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                tasks={allTasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => router.push("/archive")}>
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsTaskPoolOpen((prev) => !prev)}
                  >
                    <ListTodoIcon className="mr-2 h-4 w-4" />
                    Unscheduled
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-2" />
                    Print Week View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                onToggleUnscheduled={() => setIsTaskPoolOpen((prev) => !prev)}
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
          <SettingsDialog
            open={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            settings={settings}
            onSave={(newSettings) => {
              // Update each setting individually
              Object.entries(newSettings).forEach(([key, value]) => {
                updateSetting(key as keyof UserSettings["preferences"], value);
              });
            }}
          />
        </>
      )}
    </main>
  );
}
