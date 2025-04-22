import { Hook } from 'phoenix_live_view';
import { paneGroupInstances } from '../core';
import { PaneData, PaneId } from '../types';
import { Writable } from '../store';

export function createPaneHook() {
  let groupId: string | null = null;
  let paneId: string | null = null;

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
        groupData.props.paneDataArray,
        groupData.props.paneDataArrayChanged
      );
    },

    destroyed() {
      const groupData = paneGroupInstances.get(groupId!);
      unregisterPane(
        paneId!,
        groupData!.props.paneDataArray,
        groupData!.props.paneDataArrayChanged
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
  paneDataArrayChanged.set(true);
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
