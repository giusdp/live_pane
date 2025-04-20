import { Hook } from 'phoenix_live_view';
import { writable } from '../store';
import type { Direction, PaneData, PaneGroupData, DragState } from '../types';
import {
  paneGroupInstances,
  registerPaneFn,
  registerResizeHandlerFn,
  unregisterPaneFn
} from '../core';

export function createGroupHook() {
  let groupHook: Hook = {
    mounted() {
      const paneDataArray = writable<PaneData[]>([]);
      const paneDataArrayChanged = writable(false);

      const direction = writable<Direction>('horizontal');
      const dragState = writable<DragState | null>(null);
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
      const registerResizeHandler = registerResizeHandlerFn(
        direction,
        dragState,
        groupId,
        layout,
        paneDataArray,
        prevDelta
      );

      const groupData: PaneGroupData = {
        props: {
          paneDataArray,
          paneDataArrayChanged,
          direction,
          dragState,
          groupId,
          dragHandleId,
          layout,
          prevDelta
        },
        methods: {
          registerPane,
          unregisterPane,
          registerResizeHandler
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
