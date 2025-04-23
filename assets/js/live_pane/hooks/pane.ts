import { Hook } from 'phoenix_live_view';
import { PaneData, PaneGroupData, PaneId } from '../types';
import { Unsubscriber, Writable } from '../store';
import { dragState, paneGroupInstances } from '../core';
import { computePaneFlexBoxStyle } from '../style';

export function createPaneHook() {
  let groupId: string | null = null;
  let paneId: string | null = null;

  let unsubs: Unsubscriber[] = [];

  let paneHook: Hook = {
    mounted() {
      groupId = this.el.getAttribute('data-pane-group-id');
      if (!groupId) {
        throw Error('data-pane-group-id must exist for pane components!');
      }
      paneId = this.el.id;
      if (!paneId) {
        throw Error('Id must exist for pane components!');
      }
      const orderAttr = this.el.getAttribute('data-pane-order');
      const order = orderAttr ? Number(orderAttr) : 0;

      const groupData = paneGroupInstances.get(groupId);
      if (!groupData) {
        throw Error('Group with id "' + groupId + '" does not exist.');
      }

      const paneData: PaneData = {
        id: this.el.id,
        order,
        constraints: {
          collapsedSize: 0, // TODO constraints should be passed in as props optionally
          collapsible: false,
          defaultSize: undefined,
          maxSize: 100,
          minSize: 0
        }
      };

      registerPane(
        paneData,
        groupData.paneDataArray,
        groupData.paneDataArrayChanged
      );

      unsubs = setupReactivePaneStyle(this.el, groupData, paneData, undefined);
    },

    destroyed() {
      for (const unsub of unsubs) {
        unsub();
      }
      unsubs = [];
      const groupData = paneGroupInstances.get(groupId!);
      unregisterPane(
        paneId!,
        groupData!.paneDataArray,
        groupData!.paneDataArrayChanged
      );
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
  const dragStateUnsub = dragState.subscribe(_ => (el.style.cssText = getPaneStyle()));

  return [arrUnsub, layoutUnsub, dragStateUnsub];
}
