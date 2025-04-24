import { Unsubscriber, writable, type Writable } from './store';

export const PRECISION = 10;

export const paneGroupInstances = new Map<GroupId, PaneGroupData>();
export const paneInstances = new Map<PaneId, PaneManagementData>();
export const resizerInstances = new Map<ResizerId, ResizerData>();
export const dragState: Writable<DragState | null> = writable(null);

export type PaneManagementData = {
  groupId: string;
  unsubs: Unsubscriber[];
};
export type ResizerData = {
  disabled: Writable<boolean>;
  resizeHandlerCallback: ResizeHandler | null;
  isDragging: Writable<boolean>;
  unsubs: Unsubscriber[];
};

export type GroupId = string;
export type PaneId = string;
export type ResizerId = string;

export type PaneGroupData = {
  paneDataArray: Writable<PaneData[]>;
  paneDataArrayChanged: Writable<boolean>;
  direction: Writable<Direction>;
  dragHandleId: string;
  layout: Writable<number[]>;
  prevDelta: Writable<number>;

  unsubFromPaneDataChange: Unsubscriber;
};

export type Direction = 'horizontal' | 'vertical';

export type DragState = {
  dragHandleId: string;
  dragHandleRect: DOMRect;
  initialCursorPosition: number;
  initialLayout: number[];
};

export type PaneConstraints = {
  collapsedSize: number;
  collapsible: boolean;
  defaultSize?: number;
  maxSize: number;
  minSize: number;
};

export type PaneData = {
  id: string;
  order: number;
  constraints: PaneConstraints;
};

export type ResizeEvent = KeyboardEvent | MouseEvent | TouchEvent;
export type ResizeHandler = (event: ResizeEvent) => void;

export type PaneResizeHandleOnDragging = (isDragging: boolean) => void;
