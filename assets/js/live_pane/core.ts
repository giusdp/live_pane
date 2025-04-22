import { adjustLayoutByDelta } from './adjust-layout';
import { areArraysEqual, areNumbersAlmostEqual } from './compare';
import { resizePane } from './resize';
import { Writable } from './store';
import { computePaneFlexBoxStyle, resetGlobalCursorStyle, setGlobalCursorStyle } from './style';
import {
  Direction,
  DragState,
  GroupId,
  PaneConstraints,
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

export function resizeHandlerFn(
  direction: Writable<Direction>,
  groupId: Writable<GroupId>,
  layout: Writable<number[]>,
  paneDataArray: Writable<PaneData[]>,
  prevDelta: Writable<number>
) {
  return function resizeHandler(
    dragHandleId: string,
    initialLayout: number[] | null,
    initialCursorPosition: number | null,
    event: ResizeEvent
  ) {
    event.preventDefault();

    const $direction = direction.get();
    const $groupId = groupId.get();
    const $prevLayout = layout.get();
    const $paneDataArray = paneDataArray.get();

    const pivotIndices = getPivotIndices($groupId, dragHandleId);

    let delta = getDeltaPercentage(
      event,
      dragHandleId,
      $direction,
      initialCursorPosition
    );
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
      console.log("Layout changed", nextLayout);
    }
  };
}

export function startDraggingFn(
  direction: Writable<Direction>,
  layout: Writable<number[]>
) {
  return (dragHandleId: string, event: ResizeEvent) => {
    const $direction = direction.get();
    const $layout = layout.get();
    const handleElement = getResizeHandleElement(dragHandleId);
    assert(handleElement);

    const initialCursorPosition = getResizeEventCursorPosition(
      $direction,
      event
    );

    return {
      dragHandleId,
      dragHandleRect: handleElement.getBoundingClientRect(),
      initialCursorPosition,
      initialLayout: $layout
    } satisfies DragState;
  };
}

export function stopDraggingFn() {
  return () => {
    resetGlobalCursorStyle();
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
  initialCursorPosition: number | null
): number {
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

export function setupOnPaneDataChange(
  layout: Writable<number[]>,
  paneDataArray: Writable<PaneData[]>,
  paneDataArrayChanged: Writable<boolean>
) {
  return paneDataArrayChanged.subscribe(changed => {
    console.log(
      'onPaneDataChange setup',
      layout.get(),
      paneDataArray.get(),
      paneDataArrayChanged.get()
    );
    if (!changed) return;
    paneDataArrayChanged.set(false);

    const $prevLayout = layout.get();
    const $paneDataArray = paneDataArray.get();

    let unsafeLayout: number[] | null = null;

    if (unsafeLayout == null) {
      unsafeLayout = getUnsafeDefaultLayout({
        paneDataArray: $paneDataArray
      });
    }

    // Validate even saved layouts in case something has changed since last render
    const nextLayout = validatePaneGroupLayout({
      layout: unsafeLayout,
      paneConstraintsArray: $paneDataArray.map(paneData => paneData.constraints)
    });

    if (areArraysEqual($prevLayout, nextLayout)) return;

    layout.set(nextLayout);
  });
}

function getUnsafeDefaultLayout({ paneDataArray }: { paneDataArray: PaneData[] }): number[] {
  const layout = Array<number>(paneDataArray.length);

  const paneConstraintsArray = paneDataArray.map(
    paneData => paneData.constraints
  );

  let numPanesWithSizes = 0;
  let remainingSize = 100;

  // Distribute default sizes first
  for (let index = 0; index < paneDataArray.length; index++) {
    const paneConstraints = paneConstraintsArray[index];
    assert(paneConstraints);
    const { defaultSize } = paneConstraints;

    if (defaultSize != null) {
      numPanesWithSizes++;
      layout[index] = defaultSize;
      remainingSize -= defaultSize;
    }
  }

  // Remaining size should be distributed evenly between panes without default sizes
  for (let index = 0; index < paneDataArray.length; index++) {
    const paneConstraints = paneConstraintsArray[index];
    assert(paneConstraints);
    const { defaultSize } = paneConstraints;

    if (defaultSize != null) {
      continue;
    }

    const numRemainingPanes = paneDataArray.length - numPanesWithSizes;
    const size = remainingSize / numRemainingPanes;

    numPanesWithSizes++;
    layout[index] = size;
    remainingSize -= size;
  }

  return layout;
}

// All units must be in percentages
function validatePaneGroupLayout({
  layout: prevLayout,
  paneConstraintsArray
}: {
  layout: number[];
  paneConstraintsArray: PaneConstraints[];
}): number[] {
  const nextLayout = [...prevLayout];
  const nextLayoutTotalSize = nextLayout.reduce(
    (accumulated, current) => accumulated + current,
    0
  );

  // Validate layout expectations
  if (nextLayout.length !== paneConstraintsArray.length) {
    throw Error(
      `Invalid ${paneConstraintsArray.length} pane layout: ${nextLayout
        .map(size => `${size}%`)
        .join(', ')}`
    );
  } else if (!areNumbersAlmostEqual(nextLayoutTotalSize, 100)) {
    for (let index = 0; index < paneConstraintsArray.length; index++) {
      const unsafeSize = nextLayout[index];
      assert(unsafeSize != null);
      const safeSize = (100 / nextLayoutTotalSize) * unsafeSize;
      nextLayout[index] = safeSize;
    }
  }

  let remainingSize = 0;

  // First pass: Validate the proposed layout given each pane's constraints
  for (let index = 0; index < paneConstraintsArray.length; index++) {
    const unsafeSize = nextLayout[index];
    assert(unsafeSize != null);

    const safeSize = resizePane({
      paneConstraintsArray,
      paneIndex: index,
      size: unsafeSize
    });

    if (unsafeSize != safeSize) {
      remainingSize += unsafeSize - safeSize;

      nextLayout[index] = safeSize;
    }
  }

  // If there is additional, left over space, assign it to any pane(s) that permits it
  // (It's not worth taking multiple additional passes to evenly distribute)
  if (!areNumbersAlmostEqual(remainingSize, 0)) {
    for (let index = 0; index < paneConstraintsArray.length; index++) {
      const prevSize = nextLayout[index];
      assert(prevSize != null);
      const unsafeSize = prevSize + remainingSize;
      const safeSize = resizePane({
        paneConstraintsArray,
        paneIndex: index,
        size: unsafeSize
      });

      if (prevSize !== safeSize) {
        remainingSize -= safeSize - prevSize;
        nextLayout[index] = safeSize;

        // Once we've used up the remainder, bail
        if (areNumbersAlmostEqual(remainingSize, 0)) {
          break;
        }
      }
    }
  }

  return nextLayout;
}


// function getPaneStyleFn(paneDataArray: PaneData[], paneDataId: PaneId) {
//   const paneIndex = findPaneDataIndex(paneDataArray, paneDataId);
//   return (paneData: PaneData, defaultSize: number | undefined) => {
//     return computePaneFlexBoxStyle({
//       defaultSize,
//       dragState: $dragState,
//       layout: $layout,
//       paneData: $paneDataArray,
//       paneIndex,
//     });
//   }
// }