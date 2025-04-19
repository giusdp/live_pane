import { get, Writable } from './store';
import { GroupId, PaneData, PaneGroupData, PaneId } from './types';

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
    const $paneDataArray = get(paneDataArray);
    const index = findPaneDataIndex($paneDataArray, paneId);

    if (index < 0) return;
    paneDataArray.update(curr => {
      curr.splice(index, 1);
      paneDataArrayChanged.set(true);
      return curr;
    });
  };
}

function findPaneDataIndex(paneDataArray: PaneData[], paneDataId: PaneId) {
  return paneDataArray.findIndex(
    prevPaneData => prevPaneData.id === paneDataId
  );
}
