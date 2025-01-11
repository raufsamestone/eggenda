export const TASK_COLORS = {
  purple: '#E6D5FF',
  blue: '#D5E6FF',
  green: '#D5FFE6',
  yellow: '#FFF3D5',
  red: '#FFD5D5',
  pink: '#FFD5F0',
  orange: '#FFE6D5',
  gray: '#E6E6E6'
} as const;

export type TaskColor = typeof TASK_COLORS[keyof typeof TASK_COLORS];

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'completed';
  task_date: string | null;
  week_number: number | null;
  year: number | null;
  color?: TaskColor;
  row_index: number | null;
  created_at: string;
  updated_at: string;
  attachments?: Array<{
    name: string;
    url: string;
  }>;
}

export interface NewTask extends Record<string, unknown> {
  title: string;
  description?: string;
  status: 'todo' | 'completed';
  row_index: number;
  task_date: string | null;
  week_number: number;
  year: number;
  color?: TaskColor;
}

export interface WeekRange {
  start: Date;
  end: Date;
  weekNumber: number;
} 