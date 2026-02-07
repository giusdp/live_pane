import { Hook } from 'phoenix_live_view';
import {
  PaneData,
  PaneGroupData,
  PaneId,
  paneInstances,
  PaneState
} from '../core';
import { writable, Writable } from '../store';
import { dragState, paneGroupInstances } from '../core';
import { computePaneFlexBoxStyle } from '../style';
import {
  assert,
  findPaneDataIndex,
  isPaneCollapsed,
  paneDataHelper,
  tick
} from '../utils';
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

      let startingState = PaneState.Expanded;
      if (defaultSize && collapsible && defaultSize <= collapsedSize) {
        startingState = PaneState.Collapsed;
      }
      const paneData: PaneData = {
        id: this.el.id,
        order,
        constraints: {
          collapsedSize,
          collapsible,
          defaultSize,
          maxSize,
          minSize
        },
        state: writable(startingState)
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

      const unsubFromPaneState = paneData.state.subscribe(state => {
        const onCollapseEncodedJS = this.el.getAttribute('on-collapse');
        if (onCollapseEncodedJS && state === PaneState.Collapsed) {
          this.liveSocket.execJS(this.el, onCollapseEncodedJS);
          this.el.setAttribute('data-pane-state', 'collapsed');
          return;
        }

        const onExpandEncodedJS = this.el.getAttribute('on-expand');
        if (onExpandEncodedJS && state === PaneState.Expanded) {
          this.liveSocket.execJS(this.el, onExpandEncodedJS);
          this.el.setAttribute('data-pane-state', 'expanded');
          return;
        }

        this.el.setAttribute('data-pane-state', state);
      });

      unsubs.push(unsubFromPaneState);

      paneInstances.set(paneId, { groupId, unsubs });

      this.handleEvent('collapse', ({ pane_id }: { pane_id: string }) => {
        if (paneId === pane_id) {
          handleTransition(
            this.el,
            groupData.paneDataArray,
            groupData.layout,
            paneData,
            PaneState.Collapsing
          );
          collapsePane(paneData, groupData);
        }
      });
      this.handleEvent('expand', ({ pane_id }: { pane_id: string }) => {
        if (paneId === pane_id) {
          handleTransition(
            this.el,
            groupData.paneDataArray,
            groupData.layout,
            paneData,
            PaneState.Expanding
          );
          expandPane(paneData, groupData);
        }
      });

      this.handleEvent(
        'resize',
        ({ pane_id, size }: { pane_id: string; size: number }) => {
          if (paneId === pane_id) {
            resizePaneTo(this.el, paneData, groupData, size);
          }
        }
      );
    },

    updated() {
      const groupId = this.el.getAttribute('data-pane-group-id');
      const groupData = paneGroupInstances.get(groupId!);
      const defaultSize =
        Number(this.el.getAttribute('default-size')) || undefined;

      const paneIndex = findPaneDataIndex(
        groupData!.paneDataArray.get(),
        this.el.id
      );

      const style = computePaneFlexBoxStyle({
        defaultSize,
        dragState: dragState.get(),
        layout: groupData!.layout.get(),
        paneData: groupData!.paneDataArray.get(),
        paneIndex
      });

      this.el.style.cssText = style;
    },

    destroyed() {
      const { groupId, unsubs } = paneInstances.get(this.el.id)!;
      for (const unsub of unsubs) {
        unsub();
      }
      const groupData = paneGroupInstances.get(groupId);
      if (groupData) {
        unregisterPane(
          this.el.id,
          groupData.paneDataArray,
          groupData.paneDataArrayChanged
        );
      }
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
  groupData.paneSizeBeforeCollapseMap.update(curr => {
    curr.set(paneData.id, paneSize);
    return curr;
  });

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
  const prevPaneSize = groupData.paneSizeBeforeCollapseMap
    .get()
    .get(paneData.id);
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
}

function resizePaneTo(
  element: HTMLElement,
  paneData: PaneData,
  groupData: PaneGroupData,
  size: number
) {
  const numericSize = Number(size);
  if (!Number.isFinite(numericSize)) return;

  const { minSize = 0, maxSize = 100 } = paneData.constraints;
  const clampedSize = Math.min(Math.max(numericSize, minSize), maxSize);

  const prevLayout = groupData.layout.get();
  const paneDataArray = groupData.paneDataArray.get();

  const paneConstraintsArray = paneDataArray.map(pd => pd.constraints);

  const { paneSize, pivotIndices } = paneDataHelper(
    paneDataArray,
    paneData,
    prevLayout
  );

  if (paneSize == null) return;

  const isLastPane =
    findPaneDataIndex(paneDataArray, paneData.id) === paneDataArray.length - 1;

  const delta = isLastPane ? paneSize - clampedSize : clampedSize - paneSize;

  const nextLayout = adjustLayoutByDelta({
    delta,
    layout: prevLayout,
    paneConstraintsArray,
    pivotIndices,
    trigger: 'imperative-api'
  });

  if (areArraysEqual(prevLayout, nextLayout)) return;

  // Detect if this resize causes a collapsed<->expanded state change
  const wasCollapsed = isPaneCollapsed(paneDataArray, prevLayout, paneData);
  const willBeCollapsed = isPaneCollapsed(paneDataArray, nextLayout, paneData);

  if (paneData.constraints.collapsible && wasCollapsed !== willBeCollapsed) {
    const transState = willBeCollapsed
      ? PaneState.Collapsing
      : PaneState.Expanding;
    handleTransition(
      element,
      groupData.paneDataArray,
      groupData.layout,
      paneData,
      transState
    );
  }

  groupData.layout.set(nextLayout);
}

function handleTransition(
  element: HTMLElement,
  paneDataArray: Writable<PaneData[]>,
  layout: Writable<number[]>,
  pane: PaneData,
  transState: PaneState
) {
  pane.state.set(transState);
  tick().then(() => {
    const computedStyle = getComputedStyle(element);

    const hasTransition = computedStyle.transitionDuration !== '0s';

    if (!hasTransition) {
      const newState = isPaneCollapsed(paneDataArray.get(), layout.get(), pane)
        ? PaneState.Collapsed
        : PaneState.Expanded;
      pane.state.set(newState);
      return;
    }
    const handleTransitionEnd = (event: TransitionEvent) => {
      // Only handle width/flex transitions
      if (event.propertyName === 'flex-grow') {
        pane.state.set(
          isPaneCollapsed(paneDataArray.get(), layout.get(), pane)
            ? PaneState.Collapsed
            : PaneState.Expanded
        );
        element.removeEventListener('transitionend', handleTransitionEnd);
      }
    };

    // Always add the listener - if there's no transition, it won't fire
    element.addEventListener('transitionend', handleTransitionEnd);
  });
}
