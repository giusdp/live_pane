import { Hook } from 'phoenix_live_view';
import { Unsubscriber, Writable, writable } from '../store';
import type {
  Direction,
  PaneData,
  PaneGroupData,
  PaneConstraints
} from '../core';
import { defaultStorage, paneGroupInstances } from '../core';

import { areArraysEqual, areNumbersAlmostEqual } from '../compare';
import { assert, isHTMLElement } from '../utils';
import { resizePane } from '../resize';
import {
  loadPaneGroupState,
  PaneGroupStorage,
  updateStorageValues
} from '../storage';
import { calculateAriaValues } from '../aria';

export function createGroupHook() {
  let groupHook: Hook = {
    mounted() {
      if (!this.el.id) {
        throw Error('Pane Group must have an id.');
      }
      if (paneGroupInstances.has(this.el.id)) {
        throw Error(`Pane Group with id "${this.el.id}" already exists.`);
      }

      const dir = this.el.getAttribute('data-pane-direction') || 'horizontal';
      const keyboardResizeByAttr = this.el.getAttribute('keyboard-resize-by');
      const keyboardResizeBy: number | null = keyboardResizeByAttr
        ? Number(keyboardResizeByAttr)
        : null;

      const autoSave = this.el.getAttribute('auto-save') === 'true';

      const paneDataArray = writable<PaneData[]>([]);
      const paneDataArrayChanged = writable(false);

      const direction = writable<Direction>(dir as Direction);
      const layout = writable<number[]>([]);
      const prevDelta = writable<number>(0);

      const paneIdToLastNotifiedSizeMap: Record<string, number> = {};
      const paneSizeBeforeCollapseMap: Writable<Map<string, number>> = writable(
        new Map<string, number>()
      );

      const unsubFromPaneDataChange = updateLayoutOnPaneDataChange(
        this.el.id,
        layout,
        paneDataArray,
        paneDataArrayChanged,
        autoSave,
        paneSizeBeforeCollapseMap
      );

      const unsubFromLayoutChange = saveStateOnLayoutChange(
        this.el.id,
        layout,
        paneDataArray,
        paneSizeBeforeCollapseMap,
        autoSave
      );

      const unsubFromUpdateAriaValues =
        updateResizeHandleAriaValuesOnLayoutChange(
          this.el.id,
          layout,
          paneDataArray
        );

      const groupData: PaneGroupData = {
        paneDataArray,
        paneDataArrayChanged,
        direction,
        layout,
        prevDelta,
        keyboardResizeBy,
        paneIdToLastNotifiedSizeMap,
        paneSizeBeforeCollapseMap,
        autoSave,
        unsubFromPaneDataChange,
        unsubFromLayoutChange,
        unsubFromUpdateAriaValues
      };

      paneGroupInstances.set(this.el.id, groupData);
    },

    destroyed() {
      paneGroupInstances.get(this.el.id)?.unsubFromPaneDataChange();
      paneGroupInstances.get(this.el.id)?.unsubFromLayoutChange();
      paneGroupInstances.get(this.el.id)?.unsubFromUpdateAriaValues();
      paneGroupInstances.delete(this.el.id);
    }
  };

  return groupHook;
}

function saveStateOnLayoutChange(
  groupId: string,
  layout: Writable<number[]>,
  paneDataArray: Writable<PaneData[]>,
  paneSizeBeforeCollapseMap: Writable<Map<string, number>>,
  autoSave: boolean = false,
  storage: PaneGroupStorage = defaultStorage
): Unsubscriber {
  return layout.subscribe(layout => {
    if (!autoSave) return;
    updateStorageValues({
      saveId: groupId,
      layout,
      storage,
      paneDataArrayStore: paneDataArray,
      paneSizeBeforeCollapseStore: paneSizeBeforeCollapseMap
    });
  });
}

function updateLayoutOnPaneDataChange(
  groupId: string,
  layout: Writable<number[]>,
  paneDataArray: Writable<PaneData[]>,
  paneDataArrayChanged: Writable<boolean>,
  autoSave: boolean = false,
  paneSizeBeforeCollapseMap: Writable<Map<string, number>>
) {
  return paneDataArrayChanged.subscribe(changed => {
    if (!changed) return;
    paneDataArrayChanged.set(false);

    const $prevLayout = layout.get();
    const $paneDataArray = paneDataArray.get();

    let unsafeLayout: number[] | null = null;

    if (autoSave) {
      const state = loadPaneGroupState(groupId, $paneDataArray, defaultStorage);
      if (state) {
        paneSizeBeforeCollapseMap.set(
          new Map(Object.entries(state.expandToSizes))
        );
        unsafeLayout = state.layout;
      }
    }

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

function updateResizeHandleAriaValuesOnLayoutChange(
  groupId: string,
  layout: Writable<number[]>,
  paneDataArray: Writable<PaneData[]>
): Unsubscriber {
  return layout.subscribe(currentLayout => {
    const resizeHandleElements = getResizeHandleElementsForGroup(groupId);
    const paneDatas = paneDataArray.get();

    for (let index = 0; index < paneDatas.length - 1; index++) {
      const { valueMax, valueMin, valueNow } = calculateAriaValues({
        layout: currentLayout,
        panesArray: paneDatas,
        pivotIndices: [index, index + 1]
      });

      const resizeHandleEl = resizeHandleElements[index];

      if (isHTMLElement(resizeHandleEl)) {
        const paneData = paneDatas[index];

        resizeHandleEl.setAttribute('aria-controls', paneData.id);
        resizeHandleEl.setAttribute('aria-valuemax', '' + Math.round(valueMax));
        resizeHandleEl.setAttribute('aria-valuemin', '' + Math.round(valueMin));
        resizeHandleEl.setAttribute(
          'aria-valuenow',
          valueNow != null ? '' + Math.round(valueNow) : ''
        );
      }
    }
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

export function getResizeHandleElementsForGroup(
  groupId: string
): HTMLElement[] {
  return Array.from(
    document.querySelectorAll(
      `[data-pane-resizer-id][data-pane-group-id="${groupId}"]`
    )
  );
}
