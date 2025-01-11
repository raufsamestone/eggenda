'use client'
import { format, addWeeks, subWeeks } from 'date-fns';
import { WeekRange } from '@/types/weekRange';

interface WeeklyPaginationProps {
  currentWeek: WeekRange;
  onWeekChange: (direction: 'prev' | 'next') => void;
}

export default function WeeklyPagination({ currentWeek, onWeekChange }: WeeklyPaginationProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">
          {format(currentWeek.start, 'MMMM yyyy')}
        </h2>
        <span className="text-sm text-gray-500">
          Week {currentWeek.weekNumber}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {format(currentWeek.start, 'MMM d')} - {format(currentWeek.end, 'MMM d')}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onWeekChange('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            ←
          </button>
          <button
            onClick={() => onWeekChange('next')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
} 