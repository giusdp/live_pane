import test from 'ava';

import { resizeHandlerFn, startDraggingFn } from './core';
import {
  type Direction,
  type DragState,
  type PaneData,
  type ResizeEvent
} from './types';
import { writable } from './store';

test('registerResizeHandlerFn updates layout on resize', t => {
  const direction = writable<Direction>('horizontal');
  const dragState = writable<DragState>({
    initialLayout: [50, 50],
    initialCursorPosition: 50
  } as DragState);
  const groupId = writable('group1');
  const layout = writable<number[]>([50, 50]);

  const paneDataArray = writable<PaneData[]>([
    {
      id: 'a',
      order: 1,
      constraints: {
        minSize: 0,
        maxSize: 100,
        collapsedSize: 0,
        collapsible: false
      }
    } as PaneData,
    {
      id: 'b',
      order: 2,
      constraints: {
        minSize: 0,
        maxSize: 100,
        collapsedSize: 0,
        collapsible: false
      }
    } as PaneData
  ]);
  const prevDelta = writable<number>(0);
  const dragHandleId = 'handle1';

  // Set up DOM elements for group and handle
  const groupElem = document.createElement('div');
  // set bounding client rect
  groupElem.getBoundingClientRect = () =>
    ({ width: 100, height: 100, right: 100, bottom: 100 }) as DOMRect;
  groupElem.setAttribute('data-pane-group', '');
  groupElem.setAttribute('data-pane-group-id', 'group1');
  document.body.appendChild(groupElem);

  const handleElem = document.createElement('div');
  handleElem.setAttribute('data-pane-resizer-id', dragHandleId);
  handleElem.setAttribute('data-pane-group-id', 'group1');
  groupElem.appendChild(handleElem);

  // Simulate a MouseEvent
  const event = {
    preventDefault: () => {},
    clientX: 60, // initial cursor position was 50, moved by 10 right
    type: 'mousemove'
  } as unknown as ResizeEvent;

  const resizeHandler = resizeHandlerFn(
    direction,
    groupId,
    layout,
    paneDataArray,
    prevDelta
  );

  resizeHandler(
    dragHandleId,
    dragState.get().initialLayout,
    dragState.get().initialCursorPosition,
    event
  );

  t.deepEqual(layout.get(), [60, 40]);

  document.body.removeChild(groupElem);
});

test('startDraggingFn sets dragState with correct values', t => {
  const direction = writable<Direction>('horizontal');
  const layout = writable<number[]>([30, 70]);
  const dragHandleId = 'handle-test';
  let dragState = null;

  // Set up DOM element for handle
  const handleElem = document.createElement('div');
  handleElem.setAttribute('data-pane-resizer-id', dragHandleId);
  // set bounding client rect
  handleElem.getBoundingClientRect = () =>
    ({
      left: 10,
      top: 20,
      width: 5,
      height: 100,
      right: 15,
      bottom: 120
    }) as DOMRect;
  document.body.appendChild(handleElem);

  // Simulate a MouseEvent
  const event = {
    preventDefault: () => {},
    clientX: 42,
    clientY: 99,
    type: 'mousedown'
  } as unknown as ResizeEvent;

  const startDragging = startDraggingFn(direction, layout);

  dragState = startDragging(dragHandleId, event);

  const state = dragState;
  t.truthy(state);
  t.is(state?.dragHandleId, dragHandleId);
  t.deepEqual(state?.initialLayout, [30, 70]);
  t.deepEqual(state?.dragHandleRect, handleElem.getBoundingClientRect());
  t.is(state?.initialCursorPosition, 42);

  document.body.removeChild(handleElem);
});
