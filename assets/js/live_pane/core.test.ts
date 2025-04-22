import test from 'ava';

import {
  type Direction,
  type DragState,
  type PaneData,
  type ResizeEvent
} from './types';
import { writable } from './store';

// test('startDraggingFn sets dragState with correct values', t => {
//   const direction = writable<Direction>('horizontal');
//   const layout = writable<number[]>([30, 70]);
//   const dragHandleId = 'handle-test';
//   let dragState = null;

//   // Set up DOM element for handle
//   const handleElem = document.createElement('div');
//   handleElem.setAttribute('data-pane-resizer-id', dragHandleId);
//   // set bounding client rect
//   handleElem.getBoundingClientRect = () =>
//     ({
//       left: 10,
//       top: 20,
//       width: 5,
//       height: 100,
//       right: 15,
//       bottom: 120
//     }) as DOMRect;
//   document.body.appendChild(handleElem);

//   // Simulate a MouseEvent
//   const event = {
//     preventDefault: () => {},
//     clientX: 42,
//     clientY: 99,
//     type: 'mousedown'
//   } as unknown as ResizeEvent;

//   const startDragging = startDraggingFn(direction, layout);

//   dragState = startDragging(dragHandleId, event);

//   const state = dragState;
//   t.truthy(state);
//   t.is(state?.dragHandleId, dragHandleId);
//   t.deepEqual(state?.initialLayout, [30, 70]);
//   t.deepEqual(state?.dragHandleRect, handleElem.getBoundingClientRect());
//   t.is(state?.initialCursorPosition, 42);

//   document.body.removeChild(handleElem);
// });
