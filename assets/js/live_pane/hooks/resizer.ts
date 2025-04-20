import { Hook } from 'phoenix_live_view';
import { paneGroupInstances } from '../core';
import type { ResizeEvent } from '../types';

export function createResizerHook() {
  let groupId: string | null = null;
  let resizerId: string | null = null;
  let resizeHandler: ((event: ResizeEvent) => void) | null;

  let resizerHook: Hook = {
    mounted() {
      groupId = this.el.getAttribute('data-pane-group-id');
      if (!groupId) {
        throw Error('Group id must exist for resizer components!');
      }
      resizerId = this.el.id;
      if (!resizerId) {
        throw Error('Id must exist for resizer components!');
      }
      const groupData = paneGroupInstances.get(groupId);
      if (!groupData) {
        throw Error('Group data must exist for resizer components!');
      }

      let disabled = this.el.getAttribute('data-disabled') === 'true';
      if (disabled) {
        resizeHandler = null;
      } else {
        resizeHandler = (event: ResizeEvent) => groupData.methods.registerResizeHandler(resizerId!, event);
      }
      console.log('mounted resizer', groupId, resizerId);
    },

    destroyed() { }
  };
  return resizerHook;
}
