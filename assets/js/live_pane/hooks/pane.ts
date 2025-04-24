import { Hook } from 'phoenix_live_view';
import { PaneData, PaneGroupData, PaneId, paneInstances } from '../core';
import { Writable } from '../store';
import { dragState, paneGroupInstances } from '../core';
import { computePaneFlexBoxStyle } from '../style';

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
        undefined
      );
      paneInstances.set(paneId, {
        groupId,
        unsubs
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
