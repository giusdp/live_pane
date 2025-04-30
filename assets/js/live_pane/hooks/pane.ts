import { Hook } from 'phoenix_live_view';
import {
  CollapseEvent,
  PaneData,
  PaneGroupData,
  PaneId,
  paneInstances
} from '../core';
import { Writable } from '../store';
import { dragState, paneGroupInstances } from '../core';
import { computePaneFlexBoxStyle } from '../style';
import { assert } from '../utils';
import { adjustLayoutByDelta } from '../adjust-layout';
import { areArraysEqual } from '../compare';

export function createPaneHook() {
  let paneHook: Hook = {
    mounted() {
      const groupId = this.el.getAttribute('data-pane-group-id');
      if (!groupId) {
        throw Error('data-pane-group-id must exist for pane components!');
      }
      const paneId = this.el.id;
      if (!paneId) {
        throw Error('Id must exist for pane components!');
      }
      const orderAttr = this.el.getAttribute('data-pane-order');
      const order = orderAttr ? Number(orderAttr) : 0;

      const groupData = paneGroupInstances.get(groupId);
      if (!groupData) {
        throw Error('Group with id "' + groupId + '" does not exist.');
      }

      const collapsedSize = Number(this.el.getAttribute('collapsed-size')) || 0;
      const collapsible = this.el.getAttribute('collapsible') === 'true';
      const defaultSize =
        Number(this.el.getAttribute('default-size')) || undefined;
      const maxSize = Number(this.el.getAttribute('max-size')) || 100;
      const minSize = Number(this.el.getAttribute('min-size')) || 0;

      const paneData: PaneData = {
        id: this.el.id,
        order,
        constraints: {
          collapsedSize,
          collapsible,
          defaultSize,
          maxSize,
          minSize
        }
      };

      registerPane(
        paneData,
        groupData.paneDataArray,
        groupData.paneDataArrayChanged
      );

      const unsubs = setupReactivePaneStyle(
        this.el,
        groupData,
        paneData,
        defaultSize
      );
      paneInstances.set(paneId, { groupId, unsubs });

      this.handleEvent('collapse', ({ pane_id }: { pane_id: string }) => {
        if (paneId === pane_id) {
          collapsePane(paneData, groupData);
        }
      });
      this.handleEvent('expand', ({ pane_id }: { pane_id: string }) => {
        if (paneId === pane_id) {
          expandPane(paneData, groupData);
        }
      });
    },

    destroyed() {
      const { groupId, unsubs } = paneInstances.get(this.el.id)!;

      for (const unsub of unsubs) {
        unsub();
      }
      const groupData = paneGroupInstances.get(groupId!);
      unregisterPane(
        this.el.id,
        groupData!.paneDataArray,
        groupData!.paneDataArrayChanged
      );
      paneInstances.delete(this.el.id);
    }
  };
  return paneHook;
}

function registerPane(
  paneData: PaneData,
  paneDataArray: Writable<PaneData[]>,
  paneDataArrayChanged: Writable<boolean>
) {
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
}

function unregisterPane(
  paneId: PaneId,
  paneDataArray: Writable<PaneData[]>,
  paneDataArrayChanged: Writable<boolean>
) {
  const $paneDataArray = paneDataArray.get();
  const index = findPaneDataIndex($paneDataArray, paneId);

  if (index < 0) return;
  paneDataArray.update(curr => {
    curr.splice(index, 1);
    paneDataArrayChanged.set(true);
    return curr;
  });
}

function findPaneDataIndex(paneDataArray: PaneData[], paneDataId: PaneId) {
  return paneDataArray.findIndex(
    prevPaneData => prevPaneData.id === paneDataId
  );
}

function setupReactivePaneStyle(
  el: HTMLElement,
  groupData: PaneGroupData,
  paneData: PaneData,
  defaultSize: number | undefined
) {
  const getPaneStyle = () => {
    const paneIndex = findPaneDataIndex(
      groupData.paneDataArray.get(),
      paneData.id
    );
    return computePaneFlexBoxStyle({
      defaultSize,
      dragState: dragState.get(),
      layout: groupData.layout.get(),
      paneData: groupData.paneDataArray.get(),
      paneIndex
    });
  };

  const arrUnsub = groupData.paneDataArray.subscribe(
    _ => (el.style.cssText = getPaneStyle())
  );
  const layoutUnsub = groupData.layout.subscribe(_ => {
    el.style.cssText = getPaneStyle();
  });
  const dragStateUnsub = dragState.subscribe(
    _ => (el.style.cssText = getPaneStyle())
  );

  return [arrUnsub, layoutUnsub, dragStateUnsub];
}

function collapsePane(paneData: PaneData, groupData: PaneGroupData) {
  const prevLayout = groupData.layout.get();
  const paneDataArray = groupData.paneDataArray.get();

  if (!paneData.constraints.collapsible) return;

  const paneConstraintsArray = paneDataArray.map(
    paneData => paneData.constraints
  );

  const {
    collapsedSize = 0,
    paneSize,
    pivotIndices
  } = paneDataHelper(paneDataArray, paneData, prevLayout);

  assert(paneSize != null);

  if (paneSize === collapsedSize) return;

  // Store the size before collapse, which is returned when `expand()` is called
  groupData.paneSizeBeforeCollapseMap.set(paneData.id, paneSize);

  const isLastPane =
    findPaneDataIndex(paneDataArray, paneData.id) === paneDataArray.length - 1;
  const delta = isLastPane
    ? paneSize - collapsedSize
    : collapsedSize - paneSize;

  const nextLayout = adjustLayoutByDelta({
    delta,
    layout: prevLayout,
    paneConstraintsArray,
    pivotIndices,
    trigger: 'imperative-api'
  });

  if (areArraysEqual(prevLayout, nextLayout)) {
    return;
  }

  groupData.layout.set(nextLayout);
  const onLayout = groupData.onLayoutChange;

  if (onLayout) {
    onLayout(nextLayout);
  }
}

function expandPane(paneData: PaneData, groupData: PaneGroupData) {
  const prevLayout = groupData.layout.get();
  const paneDataArray = groupData.paneDataArray.get();

  if (!paneData.constraints.collapsible) return;
  const paneConstraintsArray = paneDataArray.map(
    paneData => paneData.constraints
  );

  const {
    collapsedSize = 0,
    paneSize,
    minSize = 0,
    pivotIndices
  } = paneDataHelper(paneDataArray, paneData, prevLayout);

  if (paneSize !== collapsedSize) return;
  // Restore this pane to the size it was before it was collapsed, if possible.
  const prevPaneSize = groupData.paneSizeBeforeCollapseMap.get(paneData.id);
  const baseSize =
    prevPaneSize != null && prevPaneSize >= minSize ? prevPaneSize : minSize;

  const isLastPane =
    findPaneDataIndex(paneDataArray, paneData.id) === paneDataArray.length - 1;

  const delta = isLastPane ? paneSize - baseSize : baseSize - paneSize;

  const nextLayout = adjustLayoutByDelta({
    delta,
    layout: prevLayout,
    paneConstraintsArray,
    pivotIndices,
    trigger: 'imperative-api'
  });

  if (areArraysEqual(prevLayout, nextLayout)) return;

  groupData.layout.set(nextLayout);

  groupData.onLayoutChange?.(nextLayout);
}

function paneDataHelper(
  paneDataArray: PaneData[],
  paneData: PaneData,
  layout: number[]
) {
  const paneConstraintsArray = paneDataArray.map(
    paneData => paneData.constraints
  );

  const paneIndex = findPaneDataIndex(paneDataArray, paneData.id);
  const paneConstraints = paneConstraintsArray[paneIndex];

  const isLastPane = paneIndex === paneDataArray.length - 1;
  const pivotIndices = isLastPane
    ? [paneIndex - 1, paneIndex]
    : [paneIndex, paneIndex + 1];

  const paneSize = layout[paneIndex];

  return {
    ...paneConstraints,
    paneSize,
    pivotIndices
  };
}
