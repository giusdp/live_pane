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
  collapsedSize?: number | undefined;
  collapsible?: boolean | undefined;
  defaultSize?: number | undefined;
  maxSize?: number | undefined;
  minSize?: number | undefined;
};

export type PaneData = {
  id: string;
  order: number;
};

export type DragState = {
  dragHandleId: string;
  dragHandleRect: DOMRect;
  initialCursorPosition: number;
  initialLayout: number[];
};

export type ResizeEvent = KeyboardEvent | MouseEvent | TouchEvent;
export type ResizeHandler = (event: ResizeEvent) => void;

export type PaneResizeHandleOnDragging = (isDragging: boolean) => void;
