import { Hook } from 'phoenix_live_view';
import { get, writable, Writable } from '../store';
import { PaneData, PaneGroupData } from '../types';
import { paneGroupInstances, registerPaneFn, unregisterPaneFn } from '../core';

export function createGroupHook() {
  let groupHook: Hook = {
    mounted() {
      const paneDataArray = writable<PaneData[]>([]);
      const paneDataArrayChanged = writable(false);

      if (paneGroupInstances.has(this.el.id)) {
        throw Error('Group Pane with id ' + this.el.id + ' already exists.');
      }

      const groupData: PaneGroupData = {
        props: {
          paneDataArray,
          paneDataArrayChanged
        },
        methods: {
          registerPane: registerPaneFn(paneDataArray, paneDataArrayChanged),
          unregisterPane: unregisterPaneFn(paneDataArray, paneDataArrayChanged)
        }
      };
      paneGroupInstances.set(this.el.id, groupData);

      console.log('mounted pane group', this.el.id);
      paneDataArray.subscribe(v => console.log(JSON.stringify(v)));
    }
  };

  return groupHook;
}

// return {
//   methods: {
//     collapsePane,
//     expandPane,
//     getSize: getPaneSize,
//     getPaneStyle,
//     isCollapsed: isPaneCollapsed,
//     isExpanded: isPaneExpanded,
//     registerPane,
//     registerResizeHandle,
//     resizePane,
//     startDragging,
//     stopDragging,
//     unregisterPane,
//     setLayout,
//     getLayout,
//   },
//   states: {
//     direction,
//     dragState,
//     groupId,
//     paneGroupAttrs,
//     paneGroupSelectors,
//     paneGroupStyle,
//     layout,
//   },
//   options,
// };
