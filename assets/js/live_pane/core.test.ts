import test from 'ava';

import {
  registerPaneFn,
  registerResizeHandlerFn,
  unregisterPaneFn
} from './core';
import {
  type Direction,
  type DragState,
  type PaneData,
  type ResizeEvent
} from './types';
import { writable } from './store';

test('registerPane adds panes and sorts by order', t => {
  const panes = writable<PaneData[]>([]);
  const changed = writable(false);

  const register = registerPaneFn(panes, changed);

  register({ id: 'a', order: 2, constraints: {} } as PaneData);
  register({ id: 'b', order: 1, constraints: {} } as PaneData);

  t.deepEqual(
    panes.get().map(p => p.id),
    ['b', 'a']
  );
  t.true(changed.get());
});

test('unregisterPane removes a pane', t => {
  const panes = writable<PaneData[]>([
    { id: 'a', order: 2, constraints: {} } as PaneData,
    { id: 'b', order: 1, constraints: {} } as PaneData
  ]);
  const changed = writable(false);

  const unregister = unregisterPaneFn(panes, changed);

  unregister('a');

  t.deepEqual(
    panes.get().map(p => p.id),
    ['b']
  );
  t.true(changed.get());
});

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
    preventDefault: () => { },
    clientX: 60, // initial cursor position was 50, moved by 10 right
    type: 'mousemove'
  } as unknown as ResizeEvent;

  const resizeHandler = registerResizeHandlerFn(
    direction,
    dragState,
    groupId,
    layout,
    paneDataArray,
    prevDelta,
    dragHandleId
  );

  resizeHandler(event);

  t.deepEqual(layout.get(), [60, 40]);

  // Cleanup
  document.body.removeChild(groupElem);
});
