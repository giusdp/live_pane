import { Hook } from 'phoenix_live_view';
import { writable } from '../store';
import type { Direction, PaneData, PaneGroupData, DragState } from '../types';
import {
  setupOnPaneDataChange,
  paneGroupInstances,
  resizeHandlerFn,
  startDraggingFn,
  stopDraggingFn
} from '../core';

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
      const groupId = writable<string>(this.el.id);
      const layout = writable<number[]>([]);
      const prevDelta = writable<number>(0);
      const dragHandleId = this.el.getAttribute('data-drag-handle-id') || '';

      if (paneGroupInstances.has(this.el.id)) {
        throw Error('Pane Group with id "' + this.el.id + '" already exists.');
      }

      const resizeHandler = resizeHandlerFn(
        direction,
        groupId,
        layout,
        paneDataArray,
        prevDelta
      );

      const startDragging = startDraggingFn(direction, layout);
      const stopDragging = stopDraggingFn();

      const groupData: PaneGroupData = {
        props: {
          paneDataArray,
          paneDataArrayChanged,
          direction,
          groupId,
          dragHandleId,
          layout,
          prevDelta
        },
        methods: {
          resizeHandler,
          startDragging,
          stopDragging
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
