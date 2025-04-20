import { adjustLayoutByDelta } from './adjust-layout';
import { areArraysEqual } from './compare';
import { Writable } from './store';
import { setGlobalCursorStyle } from './style';
import {
  Direction,
  DragState,
  GroupId,
  PaneData,
  PaneGroupData,
  PaneId,
  ResizeEvent
} from './types';
import { assert, isMouseEvent } from './utils';

export const paneGroupInstances = new Map<GroupId, PaneGroupData>();

export function registerPaneFn(
  paneDataArray: Writable<PaneData[]>,
  paneDataArrayChanged: Writable<boolean>
) {
  return (paneData: PaneData) => {
    paneDataArray.update(curr => {
      const newArr = [...curr, paneData];
      newArr.sort((paneA, paneB) => {
        const orderA = paneA.order;
        const orderB = paneB.order;

        if (orderA == null && orderB == null) {
          return 0;
        } else if (orderA == null) {
          return -1;
        } else if (orderB == null) {
          return 1;
        } else {
          return orderA - orderB;
        }
      });
      return newArr;
    });
    paneDataArrayChanged.set(true);
  };
}

export function unregisterPaneFn(
  paneDataArray: Writable<PaneData[]>,
  paneDataArrayChanged: Writable<boolean>
) {
  return (paneId: PaneId) => {
    const $paneDataArray = paneDataArray.get();
    const index = findPaneDataIndex($paneDataArray, paneId);

    if (index < 0) return;
    paneDataArray.update(curr => {
      curr.splice(index, 1);
      paneDataArrayChanged.set(true);
      return curr;
    });
  };
}

export function registerResizeHandlerFn(
  direction: Writable<Direction>,
  dragState: Writable<DragState | null>,
  groupId: Writable<GroupId>,
  layout: Writable<number[]>,
  paneDataArray: Writable<PaneData[]>,
  prevDelta: Writable<number>
) {
  return function resizeHandler(dragHandleId: string, event: ResizeEvent) {
    event.preventDefault();

    const $direction = direction.get();
    const $dragState = dragState.get();
    const $groupId = groupId.get();
    const $prevLayout = layout.get();
    const $paneDataArray = paneDataArray.get();

    const { initialLayout } = $dragState ?? {};

    const pivotIndices = getPivotIndices($groupId, dragHandleId);

    let delta = getDeltaPercentage(event, dragHandleId, $direction, $dragState);
    if (delta === 0) return;

    // support RTL
    const isHorizontal = $direction === 'horizontal';
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
      trigger: 'mouse-or-touch'
    });

    const layoutChanged = !areArraysEqual($prevLayout, nextLayout);

    if (isMouseEvent(event)) {
      // Watch for multiple subsequent deltas; this might occur for tiny cursor movements.
      // In this case, Pane sizes might not change–
      // but updating cursor in this scenario would cause a flicker.
      const $prevDelta = prevDelta.get();

      if ($prevDelta != delta) {
        prevDelta.set(delta);

        if (!layoutChanged) {
          // If the pointer has moved too far to resize the pane any further,
          // update the cursor style for a visual clue.
          // This mimics VS Code behavior.
          if (isHorizontal) {
            setGlobalCursorStyle(
              delta < 0 ? 'horizontal-min' : 'horizontal-max'
            );
          } else {
            setGlobalCursorStyle(delta < 0 ? 'vertical-min' : 'vertical-max');
          }
        } else {
          setGlobalCursorStyle(isHorizontal ? 'horizontal' : 'vertical');
        }
      }
    }

    if (layoutChanged) {
      layout.set(nextLayout);
    }
  };
}

function findPaneDataIndex(paneDataArray: PaneData[], paneDataId: PaneId) {
  return paneDataArray.findIndex(
    prevPaneData => prevPaneData.id === paneDataId
  );
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
  const element = document.querySelector(`[data-pane-resizer-id="${id}"]`);
  if (element) {
    return element as HTMLElement;
  }
  return null;
}

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
  initialDragState: DragState | null
): number {
  if (initialDragState == null) return 0;

  const isHorizontal = dir === 'horizontal';

  const handleElement = getResizeHandleElement(dragHandleId);
  assert(handleElement);

  const groupId = handleElement.getAttribute('data-pane-group-id');
  assert(groupId);

  const { initialCursorPosition } = initialDragState;

  const cursorPosition = getResizeEventCursorPosition(dir, e);

  const groupElement = getPaneGroupElement(groupId);
  assert(groupElement);

  const groupRect = groupElement.getBoundingClientRect();
  const groupSizeInPixels = isHorizontal ? groupRect.width : groupRect.height;

  const offsetPixels = cursorPosition - initialCursorPosition;
  const offsetPercentage = (offsetPixels / groupSizeInPixels) * 100;

  return offsetPercentage;
}

function getResizeEventCursorPosition(dir: Direction, e: ResizeEvent): number {
  const isHorizontal = dir === 'horizontal';

  if (isMouseEvent(e)) {
    return isHorizontal ? e.clientX : e.clientY;
  } else {
    throw Error(
      `Unsupported event type "${(e as { type?: string }).type ?? 'unknown'}"`
    );
  }
}
