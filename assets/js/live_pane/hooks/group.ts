import { Hook } from 'phoenix_live_view';
import { Writable, writable } from '../store';
import type {
  Direction,
  PaneData,
  PaneGroupData,
  PaneConstraints
} from '../types';

import { areArraysEqual, areNumbersAlmostEqual } from '../compare';
import { assert } from '../utils';
import { resizePane } from '../resize';
import { paneGroupInstances } from '../core';

export function createGroupHook() {
  let unsubFromPaneDataChange = () => {};
  let groupHook: Hook = {
    mounted() {
      if (!this.el.id) {
        throw Error('Pane Group must have an id.');
      }
      const paneDataArray = writable<PaneData[]>([]);
      const paneDataArrayChanged = writable(false);

      const direction = writable<Direction>('horizontal');
      const layout = writable<number[]>([]);
      const prevDelta = writable<number>(0);
      const dragHandleId = this.el.getAttribute('data-drag-handle-id') || '';

      if (paneGroupInstances.has(this.el.id)) {
        throw Error('Pane Group with id "' + this.el.id + '" already exists.');
      }

      const groupData: PaneGroupData = {
        paneDataArray,
        paneDataArrayChanged,
        direction,
        dragHandleId,
        layout,
        prevDelta
      };

      paneGroupInstances.set(this.el.id, groupData);

      unsubFromPaneDataChange = updateLayoutOnPaneDataChanges(
        groupData.layout,
        groupData.paneDataArray,
        groupData.paneDataArrayChanged
      );
    },

    destroyed() {
      unsubFromPaneDataChange();
    }
  };

  return groupHook;
}

export function updateLayoutOnPaneDataChanges(
  layout: Writable<number[]>,
  paneDataArray: Writable<PaneData[]>,
  paneDataArrayChanged: Writable<boolean>
) {
  return paneDataArrayChanged.subscribe(changed => {
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

function getUnsafeDefaultLayout({
  paneDataArray
}: { paneDataArray: PaneData[] }): number[] {
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
