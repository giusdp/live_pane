import { Hook } from 'phoenix_live_view';
import { paneGroupInstances } from '../core';
import type {
  PaneResizeHandleOnDragging,
  ResizeEvent,
  ResizeHandler
} from '../types';
import { chain } from '../chain';
import { addEventListener } from '../event';
import { getCursorStyle, styleToString } from '../style';
import { writable, Writable } from '../store';

type ResizerActionParams = {
  disabledStore: Writable<boolean>;
  resizeHandlerStore: Writable<ResizeHandler | null>;
  isDraggingStore: Writable<boolean>;
  // stopDragging: () => void; TODO: add
};

export function createResizerHook() {
  let groupId: string | null = null;
  let resizerId: string | null = null;

  const resizerActionParams: ResizerActionParams = {
    disabledStore: writable(false),
    resizeHandlerStore: writable<ResizeHandler | null>(null),
    isDraggingStore: writable(false)
  };

  let isFocused = false;

  let unsubEvents = () => {};

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

      // -- Prepare action params

      resizerActionParams.disabledStore.set(
        this.el.getAttribute('data-disabled') === 'true'
      );
      resizerActionParams.disabledStore.subscribe(_ =>
        resizeHandleAction(this.el, resizerActionParams)
      );
      if (!resizerActionParams.disabledStore.get()) {
        resizerActionParams.resizeHandlerStore.set((event: ResizeEvent) =>
          groupData.methods.registerResizeHandler(resizerId!, event)
        );
      }
      resizerActionParams.resizeHandlerStore.subscribe(_ =>
        resizeHandleAction(this.el, resizerActionParams)
      );

      const { update, unsub } = resizeHandleAction(
        this.el,
        resizerActionParams
      );
      unsubEvents = unsub;

      resizerActionParams.disabledStore.subscribe(_ =>
        update(resizerActionParams)
      );
      resizerActionParams.resizeHandlerStore.subscribe(_ =>
        update(resizerActionParams)
      );
      resizerActionParams.isDraggingStore.subscribe(_ =>
        update(resizerActionParams)
      );
      // --

      const style = styleToString({
        cursor: getCursorStyle(groupData.props.direction.get()),
        'touch-action': 'none',
        'user-select': 'none',
        '-webkit-user-select': 'none',
        '-webkit-touch-callout': 'none'
      });

      this.el.style.cssText = style;

      this.el.onblur = () => (isFocused = false);
      this.el.onfocus = () => (isFocused = true);

      this.el.onmousedown = e => {
        e.preventDefault();
        console.log('mousedown resizer', groupId, resizerId);
        // startDragging(resizeHandleId, e);
        // onDraggingChange?.(true);
      };
      this.el.onmouseup = () => {
        console.log('mouseup resizer', groupId, resizerId);
      };

      console.log('mounted resizer', groupId, resizerId);
    },

    destroyed() {
      unsubEvents();
    }
  };
  return resizerHook;
}

export function resizeHandleAction(
  node: HTMLElement,
  params: ResizerActionParams
) {
  let unsub = () => {};
  function update(params: ResizerActionParams) {
    unsub();
    const { disabledStore, resizeHandlerStore, isDraggingStore } = params;
    const disabled = disabledStore.get();
    const resizeHandler = resizeHandlerStore.get();
    const isDragging = isDraggingStore.get();

    if (disabled || resizeHandler === null || !isDragging) return;

    const onMove = (event: ResizeEvent) => {
      resizeHandler!(event);
    };

    const onMouseLeave = (event: ResizeEvent) => {
      resizeHandler!(event);
    };

    const stopDraggingAndBlur = () => {
      node.blur();
    };

    unsub = chain(
      addEventListener(document.body, 'contextmenu', stopDraggingAndBlur),
      addEventListener(document.body, 'mousemove', onMove),
      addEventListener(document.body, 'mouseleave', onMouseLeave),
      addEventListener(window, 'mouseup', stopDraggingAndBlur)
    );
  }
  update(params);

  return {
    update,
    unsub
  };
}
