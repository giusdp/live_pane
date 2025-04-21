import { Hook } from 'phoenix_live_view';
import { writable } from '../store';
import type { Direction, PaneData, PaneGroupData, DragState } from '../types';
import {
  setupOnPaneDataChange,
  paneGroupInstances,
  registerPaneFn,
  resizeHandlerFn,
  startDraggingFn,
  stopDraggingFn,
  unregisterPaneFn
} from '../core';

export function createGroupHook() {
  let unsubFromPaneDataChange = () => { };
  let groupHook: Hook = {
    mounted() {
      const paneDataArray = writable<PaneData[]>([]);
      const paneDataArrayChanged = writable(false);

      const direction = writable<Direction>('horizontal');
      const groupId = writable<string>(this.el.id);
      const layout = writable<number[]>([]);
      const prevDelta = writable<number>(0);
      const dragHandleId = this.el.getAttribute('data-drag-handle-id') || '';

      if (paneGroupInstances.has(this.el.id)) {
        throw Error('Group Pane with id ' + this.el.id + ' already exists.');
      }

      const registerPane = registerPaneFn(paneDataArray, paneDataArrayChanged);
      const unregisterPane = unregisterPaneFn(
        paneDataArray,
        paneDataArrayChanged
      );
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
          registerPane,
          unregisterPane,
          resizeHandler,
          startDragging,
          stopDragging
        }
      };

      paneGroupInstances.set(this.el.id, groupData);

      console.log('mounted pane group', this.el.id);
      paneDataArray.subscribe(v => console.log(JSON.stringify(v)));
      unsubFromPaneDataChange = setupOnPaneDataChange(
        layout,
        paneDataArray,
        paneDataArrayChanged
      );
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
