import { Writable } from './store';

export type GroupId = string;
export type PaneId = string;
export type PaneGroupData = {
  props: {
    paneDataArray: Writable<PaneData[]>;
    paneDataArrayChanged: Writable<boolean>;
    direction: Writable<Direction>;
    // TODO: does groupId need to be writable?
    groupId: Writable<string>;
    dragHandleId: string;
    layout: Writable<number[]>;
    prevDelta: Writable<number>;
  };
  methods: {
    resizeHandler: (
      dragHandleId: string,
      initialLayout: number[] | null,
      initialCursorPosition: number | null,
      event: ResizeEvent
    ) => void;
    startDragging: (handleId: string, event: ResizeEvent) => DragState;
    stopDragging: () => void;
  };
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

export type ResizeEvent = MouseEvent;
export type ResizeHandler = (event: ResizeEvent) => void;

export type PaneResizeHandleOnDragging = (isDragging: boolean) => void;
