import { Hook } from 'phoenix_live_view';
import { dragState, paneGroupInstances, resizerInstances } from '../core';
import type {
  Direction,
  DragState,
  GroupId,
  PaneGroupData,
  ResizeEvent,
  ResizeHandler,
  ResizerData,
  ResizerId
} from '../core';
import { chain } from '../chain';
import { addEventListener } from '../event';
import {
  getCursorStyle,
  resetGlobalCursorStyle,
  setGlobalCursorStyle,
  styleToString
} from '../style';
import { Unsubscriber, writable, Writable } from '../store';
import { assert, isKeyDown, isMouseEvent, isTouchEvent } from '../utils';
import { areArraysEqual } from '../compare';
import { adjustLayoutByDelta } from '../adjust-layout';

export function createResizerHook() {
  let resizerHook: Hook = {
    mounted() {
      // -- Retrieve data from group
      let groupId = this.el.getAttribute('data-pane-group-id');
      if (!groupId) {
        throw Error('data-pane-group-id must exist for resizer components!');
      }
      let resizerId = this.el.getAttribute('id');
      if (!resizerId) {
        throw Error('Resizer id must exist for resizer components!');
      }
      const groupData = paneGroupInstances.get(groupId);
      if (!groupData) {
        throw Error(`Missing group "${groupId} for resizer "${resizerId}`);
      }

      // -- Register the resizer
      const thisResizerData: ResizerData = {
        disabled: writable(false),
        isDragging: writable(false),
        resizeHandlerCallback: null,
        unsubs: [],
        isFocused: writable(false)
      };

      resizerInstances.set(resizerId, thisResizerData);

      // -- Prepare action params
      thisResizerData.disabled.set(
        this.el.getAttribute('data-pane-disabled') === 'true'
      );

      if (!thisResizerData.disabled.get()) {
        const keyboardResizeBy = groupData.keyboardResizeBy;
        thisResizerData.resizeHandlerCallback = (event: ResizeEvent) => {
          const cursorPos = dragState.get()?.initialCursorPosition ?? null;
          const initialLayout = dragState.get()?.initialLayout ?? null;
          resizeHandler(
            groupId,
            resizerId,
            groupData,
            initialLayout,
            cursorPos,
            keyboardResizeBy,
            event
          );
        };
      }

      const unsubEvents = setupResizeEvents(
        resizerId,
        this.el,
        thisResizerData
      );

      thisResizerData.unsubs.push(unsubEvents);

      // -- Set up the element
      const style = styleToString({
        cursor: getCursorStyle(groupData.direction.get()),
        'touch-action': 'none',
        'user-select': 'none',
        '-webkit-user-select': 'none',
        '-webkit-touch-callout': 'none'
      });

      this.el.style.cssText = style;

      this.el.onblur = () => thisResizerData.isFocused.set(false);
      this.el.onfocus = () => thisResizerData.isFocused.set(true);

      this.el.onmousedown = e => {
        e.preventDefault();
        const nextDragState = startDragging(
          groupData.direction,
          groupData.layout,
          resizerId,
          e
        );
        dragState.set(nextDragState);
        thisResizerData.isDragging.set(
          dragState.get()?.dragHandleId === resizerId
        );
      };

      this.el.onmouseup = () => {
        dragState.set(null);
        resetGlobalCursorStyle();
        thisResizerData.isDragging.set(false);
      };

      this.el.ontouchcancel = () => {
        dragState.set(null);
        resetGlobalCursorStyle();
        thisResizerData.isDragging.set(false);
      };

      this.el.ontouchend = () => {
        dragState.set(null);
        resetGlobalCursorStyle();
        thisResizerData.isDragging.set(false);
      };

      this.el.ontouchstart = e => {
        e.preventDefault();
        const nextDragState = startDragging(
          groupData.direction,
          groupData.layout,
          resizerId,
          e
        );
        dragState.set(nextDragState);
        thisResizerData.isDragging.set(
          dragState.get()?.dragHandleId === resizerId
        );
      };

      this.el.onkeydown = e => {
        handleKeydown(
          groupId,
          resizerId,
          thisResizerData.disabled.get(),
          thisResizerData.resizeHandlerCallback,
          e
        );
      };
    },

    destroyed() {
      let resizerId = this.el.getAttribute('id');
      for (const unsub of resizerInstances.get(resizerId!)?.unsubs ?? []) {
        unsub();
      }
      resizerInstances.delete(resizerId!);
    }
  };

  return resizerHook;
}

function setupResizeEvents(
  resizerId: ResizerId,
  node: HTMLElement,
  params: ResizerData
): Unsubscriber {
  const { disabled, resizeHandlerCallback, isDragging } = params;

  const onMove = (event: ResizeEvent) => {
    if (
      resizerId !== dragState.get()?.dragHandleId ||
      disabled.get() ||
      !isDragging.get() ||
      resizeHandlerCallback === null
    ) {
      return;
    }
    resizeHandlerCallback(event);
  };

  const onMouseLeave = (event: ResizeEvent) => {
    if (
      resizerId !== dragState.get()?.dragHandleId ||
      disabled.get() ||
      !isDragging.get() ||
      resizeHandlerCallback === null
    ) {
      return;
    }
    resizeHandlerCallback(event);
  };

  const stopDraggingAndBlur = () => {
    if (resizerId !== dragState.get()?.dragHandleId) {
      return;
    }
    node.blur();
    isDragging.set(false);
    dragState.set(null);
    resetGlobalCursorStyle();
  };

  return chain(
    addEventListener(document.body, 'contextmenu', stopDraggingAndBlur),
    addEventListener(document.body, 'mousemove', onMove),
    addEventListener(document.body, 'mouseleave', onMouseLeave),
    addEventListener(window, 'mouseup', stopDraggingAndBlur),
    addEventListener(document.body, 'touchmove', onMove, { passive: false }),
    addEventListener(window, 'touchend', stopDraggingAndBlur)
  );
}

function resizeHandler(
  groupId: GroupId,
  resizerId: ResizerId,
  groupData: PaneGroupData,
  initialLayout: number[] | null,
  initialCursorPosition: number | null,
  keyboardResizeBy: number | null,
  event: ResizeEvent
) {
  event.preventDefault();

  const direction = groupData.direction.get();
  const $prevLayout = groupData.layout.get();
  const $paneDataArray = groupData.paneDataArray.get();
  const pivotIndices = getPivotIndices(groupId, resizerId);

  let delta = getDeltaPercentage(
    event,
    resizerId,
    direction,
    initialCursorPosition,
    keyboardResizeBy
  );
  if (delta === 0) return;

  // support RTL
  const isHorizontal = direction === 'horizontal';
  if (document.dir === 'rtl' && isHorizontal) {
    delta = -delta;
  }

  const paneConstraintsArray = $paneDataArray.map(
    paneData => paneData.constraints
  );

  const nextLayout = adjustLayoutByDelta({
    delta,
    layout: initialLayout ?? $prevLayout,
    paneConstraintsArray,
    pivotIndices,
    trigger: isKeyDown(event) ? 'keyboard' : 'mouse-or-touch'
  });

  const layoutChanged = !areArraysEqual($prevLayout, nextLayout);

  if (isMouseEvent(event) || isTouchEvent(event)) {
    // Watch for multiple subsequent deltas; this might occur for tiny cursor movements.
    // In this case, Pane sizes might not change–
    // but updating cursor in this scenario would cause a flicker.
    const $prevDelta = groupData.prevDelta.get();

    if ($prevDelta != delta) {
      groupData.prevDelta.set(delta);

      if (!layoutChanged) {
        // If the pointer has moved too far to resize the pane any further,
        // update the cursor style for a visual clue.
        // This mimics VS Code behavior.
        if (isHorizontal) {
          setGlobalCursorStyle(delta < 0 ? 'horizontal-min' : 'horizontal-max');
        } else {
          setGlobalCursorStyle(delta < 0 ? 'vertical-min' : 'vertical-max');
        }
      } else {
        setGlobalCursorStyle(isHorizontal ? 'horizontal' : 'vertical');
      }
    }
  }

  if (layoutChanged) {
    groupData.layout.set(nextLayout);
  }
}

function startDragging(
  direction: Writable<Direction>,
  layout: Writable<number[]>,
  dragHandleId: string,
  event: ResizeEvent
) {
  const handleElement = getResizeHandleElement(dragHandleId);
  assert(handleElement);

  return {
    dragHandleId,
    dragHandleRect: handleElement.getBoundingClientRect(),
    initialCursorPosition: getResizeEventCursorPosition(direction.get(), event),
    initialLayout: layout.get()
  } satisfies DragState;
}

// -- Helper functions
function getPivotIndices(
  groupId: string,
  dragHandleId: string
): [indexBefore: number, indexAfter: number] {
  const index = getResizeHandleElementIndex(groupId, dragHandleId);
  return index != null ? [index, index + 1] : [-1, -1];
}

// https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/movementX
function getDeltaPercentage(
  e: ResizeEvent,
  dragHandleId: string,
  dir: Direction,
  initialCursorPosition: number | null,
  keyboardResizeBy: number | null
): number {
  if (isKeyDown(e)) {
    const isHorizontal = dir === 'horizontal';

    let delta = 0;
    if (e.shiftKey) {
      delta = 100;
    } else if (keyboardResizeBy != null) {
    } else {
      delta = 5;
    }

    let movement = 0;
    switch (e.key) {
      case 'ArrowDown':
        movement = isHorizontal ? 0 : delta;
        break;
      case 'ArrowLeft':
        movement = isHorizontal ? -delta : 0;
        break;
      case 'ArrowRight':
        movement = isHorizontal ? delta : 0;
        break;
      case 'ArrowUp':
        movement = isHorizontal ? 0 : -delta;
        break;
      case 'End':
        movement = 100;
        break;
      case 'Home':
        movement = -100;
        break;
    }

    return movement;
  } else {
    if (initialCursorPosition == null) return 0;

    const isHorizontal = dir === 'horizontal';

    const handleElement = getResizeHandleElement(dragHandleId);
    assert(handleElement);

    const groupId = handleElement.getAttribute('data-pane-group-id');
    assert(groupId);

    const cursorPosition = getResizeEventCursorPosition(dir, e);

    const groupElement = getPaneGroupElement(groupId);
    assert(groupElement);

    const groupRect = groupElement.getBoundingClientRect();
    const groupSizeInPixels = isHorizontal ? groupRect.width : groupRect.height;

    const offsetPixels = cursorPosition - initialCursorPosition;
    const offsetPercentage = (offsetPixels / groupSizeInPixels) * 100;

    return offsetPercentage;
  }
}

function getResizeEventCursorPosition(dir: Direction, e: ResizeEvent): number {
  const isHorizontal = dir === 'horizontal';

  if (isMouseEvent(e)) {
    return isHorizontal ? e.clientX : e.clientY;
  } else if (isTouchEvent(e)) {
    const firstTouch = e.touches[0];
    assert(firstTouch);
    return isHorizontal ? firstTouch.screenX : firstTouch.screenY;
  } else {
    throw Error(
      `Unsupported event type "${(e as { type?: string }).type ?? 'unknown'}"`
    );
  }
}

function getResizeHandleElementsForGroup(groupId: string): HTMLElement[] {
  return Array.from(
    document.querySelectorAll(
      `[data-pane-resizer-id][data-pane-group-id="${groupId}"]`
    )
  );
}

function getResizeHandleElementIndex(
  groupId: string,
  id: string
): number | null {
  const handles = getResizeHandleElementsForGroup(groupId);
  const index = handles.findIndex(
    handle => handle.getAttribute('data-pane-resizer-id') === id
  );
  return index ?? null;
}

function getResizeHandleElement(id: string): HTMLElement | null {
  const element = document.querySelector(
    `[data-pane-resizer][data-pane-resizer-id="${id}"]`
  );
  if (element) {
    return element as HTMLElement;
  }
  return null;
}

function getPaneGroupElement(id: string): HTMLElement | null {
  const element = document.querySelector(
    `[data-pane-group][data-pane-group-id="${id}"]`
  );
  if (element) {
    return element as HTMLElement;
  }
  return null;
}

function handleKeydown(
  groupId: GroupId,
  resizeHandleId: ResizerId,
  disabled: boolean,
  resizeHandler: ResizeHandler | null,
  event: KeyboardEvent
) {
  if (disabled || !resizeHandler || event.defaultPrevented) return;

  const resizeKeys = [
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'End',
    'Home'
  ];

  if (resizeKeys.includes(event.key)) {
    event.preventDefault();
    resizeHandler(event);
    return;
  }

  if (event.key !== 'F6') return;

  event.preventDefault();

  const handles = getResizeHandleElementsForGroup(groupId);
  const index = getResizeHandleElementIndex(groupId, resizeHandleId);

  if (index === null) return;

  const nextIndex = event.shiftKey
    ? index > 0
      ? index - 1
      : handles.length - 1
    : index + 1 < handles.length
      ? index + 1
      : 0;

  const nextHandle = handles[nextIndex] as HTMLElement;
  nextHandle.focus();
}
