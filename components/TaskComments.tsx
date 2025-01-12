'use client'

import { useState, useEffect } from 'react';
import { Comment } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Edit2, Trash2, Send, X, Check } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TaskCommentsProps {
  taskId: string;
  comments: Comment[];
  onCommentsChange: (comments: Comment[]) => void;
}

export default function TaskComments({ taskId, comments, onCommentsChange }: TaskCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('task_id', taskId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        onCommentsChange(data as Comment[]);
      } catch (error) {
        console.error('Error fetching comments:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch comments',
          variant: 'destructive',
        });
      }
    };

    fetchComments();
  }, [taskId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: 'Error',
          description: 'You must be logged in to add comments',
          variant: 'destructive',
        });
        return;
      }

      // Debug log
      console.log('Attempting to insert comment with data:', {
        taskId,
        userId: user.id,
        content: newComment.trim()
      });

      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          task_id: taskId,
          content: newComment.trim(),
          user_id: user.id
        })
        .select('*')
        .single();

      if (error) {
        console.error('Insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log('Successfully inserted comment:', comment);

      // Only update UI if we have the comment data
      if (comment) {
        onCommentsChange([...comments, comment as Comment]);
        setNewComment('');
        
        toast({
          title: 'Success',
          description: 'Comment added successfully',
        });
      }
    } catch (error: any) {
      console.error('Full error object:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) {
        console.error('Update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      onCommentsChange(
        comments.map(comment =>
          comment.id === commentId
            ? { ...comment, content: editContent.trim(), updated_at: new Date().toISOString() }
            : comment
        )
      );
      
      setEditingCommentId(null);
      setEditContent('');
      
      toast({
        title: 'Success',
        description: 'Comment updated successfully',
      });
    } catch (error: any) {
      console.error('Full error object:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Delete error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      onCommentsChange(comments.filter(comment => comment.id !== commentId));
      
      toast({
        title: 'Success',
        description: 'Comment deleted successfully',
      });
    } catch (error: any) {
      console.error('Full error object:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete comment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {comments.map(comment => (
          <div
            key={comment.id}
            className="bg-muted/50 rounded-lg p-3 space-y-2"
          >
            {editingCommentId === comment.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px] resize-none"
                  placeholder="Edit your comment..."
                  disabled={isSubmitting}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEditing}
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleEditComment(comment.id)}
                    disabled={isSubmitting}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(comment.created_at), 'PPp')}
                      {comment.updated_at !== comment.created_at && ' (edited)'}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => startEditing(comment)}
                      disabled={isSubmitting}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="min-h-[60px] resize-none"
          disabled={isSubmitting}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (newComment.trim()) {
                handleAddComment();
              }
            }
          }}
        />
        <Button
          variant="default"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={handleAddComment}
          disabled={!newComment.trim() || isSubmitting}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}