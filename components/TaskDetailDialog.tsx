"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Task, TaskColor, TASK_COLORS, Comment } from "@/types/task";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "@/components/ui/button";
import { format, addDays, addWeeks, startOfWeek, getWeek } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Archive,
  X,
  Upload,
  Paperclip,
  RefreshCw,
  ArrowRight,
  Calendar,
  Copy,
  Inbox,
  CalendarDays,
  MessageSquare,
  MoreHorizontal,
} from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { debounce } from "lodash";
import TaskComments from "./TaskComments";
import { useHotkeys } from "react-hotkeys-hook";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Attachment {
  name: string;
  url: string;
  signedUrl?: string;
  expires?: Date;
}

interface TaskDetailDialogProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (task: Task) => void;
  onWeekChange?: (date: Date) => void;
}

function useAttachments(taskAttachments: Attachment[] | undefined) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previousAttachmentsRef = useRef<string>("");

  // Memoize the attachments JSON string for comparison
  const attachmentsJson = useMemo(
    () => (taskAttachments ? JSON.stringify(taskAttachments) : ""),
    [taskAttachments]
  );

  useEffect(() => {
    // Only load if attachments have changed
    if (attachmentsJson === previousAttachmentsRef.current) {
      return;
    }
    previousAttachmentsRef.current = attachmentsJson;

    let mounted = true;
    const loadSignedUrls = async () => {
      if (!taskAttachments?.length) {
        if (mounted) setAttachments([]);
        return;
      }

      const signedAttachments = await Promise.all(
        taskAttachments.map(async (att) => {
          try {
            const filePath = att.url.replace(/^.*task_attachments\//, "");

            const { data, error } = await supabase.storage
              .from("task_attachments")
              .createSignedUrl(filePath, 3600);

            if (error) {
              console.error("Error creating signed URL:", error);
              return {
                ...att,
                signedUrl: att.url,
                expires: new Date(Date.now() + 3600 * 1000),
              };
            }

            return {
              ...att,
              signedUrl: data.signedUrl,
              expires: new Date(Date.now() + 3600 * 1000),
            };
          } catch (error) {
            console.error("Error loading attachment:", error);
            return {
              ...att,
              signedUrl: att.url,
              expires: new Date(Date.now() + 3600 * 1000),
            };
          }
        })
      );

      if (mounted) setAttachments(signedAttachments);
    };

    loadSignedUrls();

    return () => {
      mounted = false;
    };
  }, [attachmentsJson, supabase.storage]);

  const refreshSignedUrls = async () => {
    if (!taskAttachments?.length) return;

    setIsRefreshing(true);
    try {
      const refreshedAttachments = await Promise.all(
        taskAttachments.map(async (att) => {
          try {
            const filePath = att.url.replace(/^.*task_attachments\//, "");

            const { data, error } = await supabase.storage
              .from("task_attachments")
              .createSignedUrl(filePath, 3600);

            if (error) {
              console.error("Error refreshing signed URL:", error);
              return {
                ...att,
                signedUrl: att.url,
                expires: new Date(Date.now() + 3600 * 1000),
              };
            }

            return {
              ...att,
              signedUrl: data.signedUrl,
              expires: new Date(Date.now() + 3600 * 1000),
            };
          } catch (error) {
            console.error("Error refreshing attachment:", error);
            return {
              ...att,
              signedUrl: att.url,
              expires: new Date(Date.now() + 3600 * 1000),
            };
          }
        })
      );

      setAttachments(refreshedAttachments);
    } catch (error) {
      console.error("Error refreshing signed URLs:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return { attachments, isRefreshing, refreshSignedUrls };
}

export default function TaskDetailDialog({
  task,
  open,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onWeekChange,
}: TaskDetailDialogProps) {
  const [title, setTitle] = useState(task.title);
  const [selectedColor, setSelectedColor] = useState<TaskColor | undefined>(
    task.color
  );
  const [isUploading, setIsUploading] = useState(false);
  const { attachments, isRefreshing, refreshSignedUrls } = useAttachments(
    task.attachments
  );
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [StarterKit],
    content: task.description || "",
    editable: true,
    onUpdate: debounce(({ editor }) => {
      const description = editor.getHTML();
      if (description !== task.description) {
        onUpdate(task.id, { description });
      }
    }, 500),
  });

  // Update the debounced title update to handle both title and color
  const debouncedUpdate = useCallback(
    debounce((updates: Partial<Task>) => {
      onUpdate(task.id, updates);
    }, 500),
    [task.id, onUpdate]
  );

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    debouncedUpdate({ title: newTitle });
  };

  // Handle color change
  const handleColorChange = (color: TaskColor) => {
    setSelectedColor(color);
    debouncedUpdate({ color });
  };

  const handleMoveToTomorrow = async () => {
    if (!task.task_date) return;
    const tomorrow = addDays(new Date(task.task_date), 1);
    await onUpdate(task.id, {
      task_date: format(tomorrow, "yyyy-MM-dd"),
      week_number: getWeek(tomorrow),
      year: tomorrow.getFullYear(),
    });
  };

  const handleMoveToNextWeek = async () => {
    if (!task.task_date) return;
    const nextWeek = addWeeks(new Date(task.task_date), 1);
    await onUpdate(task.id, {
      task_date: format(nextWeek, "yyyy-MM-dd"),
      week_number: getWeek(nextWeek),
      year: nextWeek.getFullYear(),
    });
  };

  const handleMoveToUnscheduled = async () => {
    await onUpdate(task.id, {
      task_date: null,
      week_number: null,
      year: null,
    });
  };

  const handleGoToDate = () => {
    if (task.task_date && onWeekChange) {
      const taskDate = new Date(task.task_date);
      onWeekChange(startOfWeek(taskDate, { weekStartsOn: 1 }));
      onClose();
    }
  };

  const handleDuplicate = () => {
    if (onDuplicate) {
      onDuplicate({
        ...task,
        id: "", // Will be generated by the database
        title: `${task.title} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      onClose();
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) return;
    setIsUploading(true);
    const file = event.target.files[0];

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${task.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("task_attachments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = await supabase.storage
        .from("task_attachments")
        .getPublicUrl(fileName);

      if (urlData) {
        const newAttachment = {
          name: file.name,
          url: urlData.publicUrl,
        };

        const currentAttachments = task.attachments || [];
        const updatedAttachments = [...currentAttachments, newAttachment];
        await onUpdate(task.id, { attachments: updatedAttachments });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const getSignedUrl = async (url: string) => {
    try {
      const filePath = url.replace(/^.*task_attachments\//, "");
      const { data, error } = await supabase.storage
        .from("task_attachments")
        .createSignedUrl(filePath, 604800); // 7 days expiration

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      return url;
    }
  };

  const handleDeleteAttachment = async (attachmentUrl: string) => {
    try {
      const currentAttachments = task.attachments || [];
      // Extract the file path from the signed URL
      const filePath = attachmentUrl
        .split("?")[0]
        .replace(/^.*task_attachments\//, "");

      // Delete the file from storage
      const { error: deleteError } = await supabase.storage
        .from("task_attachments")
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update the task's attachments
      const updatedAttachments = currentAttachments.filter(
        (att) => att.url.split("?")[0] !== attachmentUrl.split("?")[0]
      );

      await onUpdate(task.id, { attachments: updatedAttachments });
    } catch (error) {
      console.error("Error deleting attachment:", error);
    }
  };

  const handleArchive = async () => {
    try {
      // First update the database
      const { error: dbError } = await supabase
        .from("tasks")
        .update({
          status: "archived",
        })
        .eq("id", task.id);

      if (dbError) throw dbError;

      // Then update the local state through the parent component
      onUpdate(task.id, {
        status: "archived",
      });

      toast({
        title: "Task Archived",
        description: "The task has been moved to the archive",
      });

      onClose();
    } catch (error: any) {
      console.error("Error archiving task:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to archive task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCommentsChange = (newComments: Comment[]) => {
    task.comments = newComments; // Just update the local state
  };

  // Add hotkey for archiving
  useHotkeys(
    "mod+a",
    (e) => {
      e.preventDefault();
      if (open) {
        handleArchive();
      }
    },
    {
      enabled: open, // Only enable when dialog is open
      preventDefault: true,
    },
    [open]
  );

  // Reset title when task changes
  useEffect(() => {
    setTitle(task.title);
  }, [task.title]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        // style={{
        //   backgroundColor: task.color,
        // }}
      >
        <DialogHeader>
          <DialogTitle>
            {task.task_date
              ? format(new Date(task.task_date), "PPP")
              : "No date"}
          </DialogTitle>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                className="w-full text-xl font-semibold bg-transparent focus:outline-none focus:border-b border-primary pb-1"
                placeholder="Task title"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Action buttons in dropdown */}
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {task.task_date && (
                  <>
                    <DropdownMenuItem onClick={handleMoveToTomorrow}>
                      <ArrowRight className="w-3 h-3 mr-2" />
                      Move to tomorrow
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMoveToNextWeek}>
                      <Calendar className="w-3 h-3 mr-2" />
                      Move to next week
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={handleMoveToUnscheduled}>
                  <Inbox className="w-3 h-3 mr-2" />
                  Move to unscheduled
                </DropdownMenuItem>
                {task.task_date && (
                  <>
                    <DropdownMenuItem
                      onClick={handleArchive}
                      className="text-destructive focus:text-destructive"
                    >
                      <Archive className="w-3 h-3 mr-2" />
                      Archive
                      <div className="ml-auto flex items-center">
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                          <span className="text-xs">⌘</span>A
                        </kbd>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Color Selection - Made more compact */}
          <div className="flex gap-1">
            {Object.entries(TASK_COLORS).map(([name, color]) => (
              <button
                key={color}
                className={`w-5 h-5 rounded-full transition-transform ${
                  selectedColor === color
                    ? "ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleColorChange(color as TaskColor)}
              />
            ))}
          </div>

          {/* Rich Text Editor - Made larger */}
          <div className="prose dark:prose-invert max-w-none border rounded-lg p-4 min-h-[200px]">
            <EditorContent editor={editor} />
          </div>

          {/* Tabs for Attachments and Comments */}
          <Tabs defaultValue="comments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="comments" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comments ({task.comments?.length || 0})
              </TabsTrigger>
              <TabsTrigger
                value="attachments"
                className="flex items-center gap-2"
              >
                <Paperclip className="w-4 h-4" />
                Attachments ({task.attachments?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="attachments" className="space-y-4 mt-2">
              {(task.attachments?.length ?? 0) > 0 && task.attachments && (
                <div className="grid grid-cols-2 gap-2">
                  {task.attachments.map((attachment) => (
                    <div
                      key={attachment.url}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <a
                        href="#"
                        onClick={async (e) => {
                          e.preventDefault();
                          const signedUrl = await getSignedUrl(attachment.url);
                          window.open(signedUrl, "_blank");
                        }}
                        className="text-sm text-primary hover:underline truncate"
                      >
                        {attachment.name}
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAttachment(attachment.url)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                  disabled={isUploading}
                  className="h-7 px-2 text-xs"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  {isUploading ? "Uploading..." : "Add attachment"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="comments" className="mt-2">
              <TaskComments
                taskId={task.id}
                comments={task.comments || []}
                onCommentsChange={handleCommentsChange}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
