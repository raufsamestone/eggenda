'use client'

import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { supabase } from '@/utils/supabase/client';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ArchivePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchArchivedTasks();
  }, []);

  const fetchArchivedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'archived')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTasks(data as Task[]);
    } catch (error) {
      console.error('Error fetching archived tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch archived tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedTasks.size === tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(tasks.map(task => task.id)));
    }
  };

  const handleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const handlePermanentDelete = async () => {
    if (!selectedTasks.size) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', Array.from(selectedTasks));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Permanently deleted ${selectedTasks.size} tasks`,
      });

      setSelectedTasks(new Set());
      await fetchArchivedTasks();
    } catch (error) {
      console.error('Error deleting tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedTasks.size) return;

    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('tasks')
        .update({
          status: 'todo'
        })
        .in('id', Array.from(selectedTasks));

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Restored ${selectedTasks.size} tasks`,
      });

      setSelectedTasks(new Set());
      await fetchArchivedTasks();
    } catch (error) {
      console.error('Error restoring tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to restore tasks',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Archived Tasks</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestore}
            className="flex items-center gap-2 h-8 px-3 text-xs"
            disabled={!selectedTasks.size || isLoading}
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Restore
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex items-center gap-2 h-8 px-3 text-xs"
            onClick={handlePermanentDelete}
            disabled={!selectedTasks.size || isLoading}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTasks.size === tasks.length && tasks.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Archived Date</TableHead>
              <TableHead>Original Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTasks.has(task.id)}
                    onCheckedChange={() => handleSelectTask(task.id)}
                  />
                </TableCell>
                <TableCell>{task.title}</TableCell>
                <TableCell className="max-w-md truncate">
                  {task.description || '-'}
                </TableCell>
                <TableCell>
                  {format(new Date(task.updated_at), 'PPP')}
                </TableCell>
                <TableCell>
                  {task.task_date ? format(new Date(task.task_date), 'PPP') : '-'}
                </TableCell>
              </TableRow>
            ))}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No archived tasks found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}