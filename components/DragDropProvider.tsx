'use client'

import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { ReactNode } from 'react';

interface DragDropProviderProps {
  children: ReactNode;
  onDragEnd: (result: DropResult) => void;
}

export default function DragDropProvider({ children, onDragEnd }: DragDropProviderProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      {children}
    </DragDropContext>
  );
} 