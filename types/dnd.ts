import type { DraggableLocation, DropResult } from '@hello-pangea/dnd';

export interface DragEndResult extends DropResult {
  source: DraggableLocation;
  destination: DraggableLocation | null;
} 