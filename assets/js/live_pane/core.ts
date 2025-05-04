import { initializeStorage, PaneGroupStorage } from './storage';
import { Unsubscriber, writable, type Writable } from './store';

export const LOCAL_STORAGE_DEBOUNCE_INTERVAL = 100;
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
  isFocused: Writable<boolean>;
};

export type GroupId = string;
export type PaneId = string;
export type ResizerId = string;

export type PaneGroupData = {
  paneDataArray: Writable<PaneData[]>;
  paneDataArrayChanged: Writable<boolean>;
  direction: Writable<Direction>;
  layout: Writable<number[]>;
  prevDelta: Writable<number>;
  keyboardResizeBy: number | null;

  paneIdToLastNotifiedSizeMap: Record<string, number>;
  paneSizeBeforeCollapseMap: Writable<Map<string, number>>;

  autoSave: boolean;

  unsubFromPaneDataChange: Unsubscriber;
  unsubFromLayoutChange: Unsubscriber;
  unsubFromUpdateAriaValues: Unsubscriber;
  unsubFromUpdateIsCollapsed: Unsubscriber;
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
  state: Writable<PaneState>;
};

export const enum PaneState {
  Collapsing = 'collapsing',
  Expanding = 'expanding',
  Collapsed = 'collapsed',
  Expanded = 'expanded'
}

export type ResizeEvent = KeyboardEvent | MouseEvent | TouchEvent;
export type ResizeHandler = (event: ResizeEvent) => void;

export type PaneResizeHandleOnDragging = (isDragging: boolean) => void;

export type PaneOnCollapse = () => void;
export type PaneOnExpand = () => void;
export type PaneOnResize = (size: number, prevSize: number | undefined) => void;

export type CollapseEvent = {
  paneId: string;
};

export const defaultStorage: PaneGroupStorage = {
  getItem: (name: string) => {
    initializeStorage(defaultStorage);
    return defaultStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    initializeStorage(defaultStorage);
    defaultStorage.setItem(name, value);
  }
};
