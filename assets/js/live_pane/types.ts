import { Writable } from './store';

export type GroupId = string;
export type PaneId = string;
export type PaneGroupData = {
  props: {
    paneDataArray: Writable<PaneData[]>;
    paneDataArrayChanged: Writable<boolean>;
  };
  methods: {
    registerPane: (paneData: PaneData) => void;
    unregisterPane: (paneData: PaneId) => void;
  };
};

export type Direction = 'horizontal' | 'vertical';

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

export type DragState = {
  dragHandleId: string;
  dragHandleRect: DOMRect;
  initialCursorPosition: number;
  initialLayout: number[];
};

export type ResizeEvent = MouseEvent;
export type ResizeHandler = (event: ResizeEvent) => void;

export type PaneResizeHandleOnDragging = (isDragging: boolean) => void;
