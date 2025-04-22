import { Hook } from 'phoenix_live_view';
import { writable } from '../store';
import type { Direction, PaneData, PaneGroupData, DragState } from '../types';
import { setupOnPaneDataChange, paneGroupInstances } from '../core';

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
        props: {
          paneDataArray,
          paneDataArrayChanged,
          direction,
          dragHandleId,
          layout,
          prevDelta
        }
      };

      paneGroupInstances.set(this.el.id, groupData);

      // unsubFromPaneDataChange = setupOnPaneDataChange(
      //   layout,
      //   paneDataArray,
      //   paneDataArrayChanged
      // );
    },

    destroyed() {
      unsubFromPaneDataChange();
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
//     resizePane,
//     setLayout,
//     getLayout,
//   },

// };
