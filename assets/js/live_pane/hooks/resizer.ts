import { Hook } from 'phoenix_live_view';
import { paneGroupInstances } from '../core';
import type { DragState, GroupId, ResizeEvent, ResizeHandler } from '../types';
import { chain } from '../chain';
import { addEventListener } from '../event';
import { getCursorStyle, styleToString } from '../style';
import { type Unsubscriber, writable, Writable } from '../store';

type ResizerActionParams = {
  disabledStore: Writable<boolean>;
  resizeHandlerCallback: ResizeHandler | null;
  isDraggingStore: Writable<boolean>;
  stopDragging: () => void;
};

export function createResizerHook() {
  let groupId: string | null = null;
  let resizerId: string | null = null;

  let isFocused = false;
  const resizerActionParams: ResizerActionParams = {
    disabledStore: writable(false),
    resizeHandlerCallback: null,
    isDraggingStore: writable(false),
    stopDragging: () => {}
  };
  const dragState: Writable<DragState | null> = writable(null);

  let unsubs: Unsubscriber[] = [];

  let resizerHook: Hook = {
    mounted() {
      // -- Retrieve data from group
      groupId = grabGroupId(this.el);
      resizerId = grabResizerId(this.el);
      const groupData = getGroupData(groupId);

      // -- Prepare action params
      resizerActionParams.disabledStore.set(
        this.el.getAttribute('data-disabled') === 'true'
      );

      if (!resizerActionParams.disabledStore.get()) {
        resizerActionParams.resizeHandlerCallback = (event: ResizeEvent) => {
          const initialCursorPosition =
            dragState.get()?.initialCursorPosition ?? null;
          const initialLayout = dragState.get()?.initialLayout ?? null;
          groupData.methods.resizeHandler(
            resizerId!,
            initialLayout ?? null,
            initialCursorPosition ?? null,
            event
          );
        };
      }

      resizerActionParams.stopDragging = groupData.methods.stopDragging;

      const { update, unsub: unsubEvents } = setupResizerAction(
        this.el,
        resizerActionParams
      );
      unsubs.push(unsubEvents);

      unsubs.push(
        resizerActionParams.disabledStore.subscribe(_ =>
          update(resizerActionParams)
        )
      );
      unsubs.push(
        resizerActionParams.isDraggingStore.subscribe(_ =>
          update(resizerActionParams)
        )
      );

      // -- Set up the element

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
        const nextDragState = groupData.methods.startDragging(resizerId!, e);
        console.log('drag state', nextDragState);
        dragState.set(nextDragState);
        resizerActionParams.isDraggingStore.set(true);
      };
      this.el.onmouseup = () => {
        console.log('mouseup resizer', groupId, resizerId);
        resizerActionParams.isDraggingStore.set(false);
      };

      console.log('mounted resizer', groupId, resizerId);
    },

    destroyed() {
      for (const unsub of unsubs) {
        unsub();
      }
      unsubs = [];
    }
  };
  return resizerHook;
}

function getGroupData(groupId: string) {
  const groupData = paneGroupInstances.get(groupId);
  if (!groupData) {
    throw Error('Group data must exist for resizer components!');
  }
  return groupData;
}

function grabGroupId(el: HTMLElement): GroupId {
  let groupId = el.getAttribute('data-pane-group-id');
  if (!groupId) {
    throw Error('Group id must exist for resizer components!');
  }
  return groupId;
}

function grabResizerId(el: HTMLElement): string {
  let resizerId = el.getAttribute('data-pane-resizer-id');
  if (!resizerId) {
    throw Error('Resizer id must exist for resizer components!');
  }
  return resizerId;
}

function setupResizerAction(node: HTMLElement, params: ResizerActionParams) {
  let unsub = () => {};
  function update(params: ResizerActionParams) {
    unsub();
    const {
      disabledStore,
      resizeHandlerCallback,
      isDraggingStore,
      stopDragging
    } = params;
    const disabled = disabledStore.get();
    const isDragging = isDraggingStore.get();

    console.log('Updating...', disabled, isDragging);

    if (disabled || !isDragging || resizeHandlerCallback === null) return;

    const onMove = (event: ResizeEvent) => {
      resizeHandlerCallback(event);
    };

    const onMouseLeave = (event: ResizeEvent) => {
      resizeHandlerCallback(event);
    };

    const stopDraggingAndBlur = () => {
      node.blur();
      stopDragging();
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
