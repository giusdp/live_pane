import type { PaneData, PaneId, ResizeEvent } from './core';

export function noop() {}

export function assert(
  expectedCondition: any,
  message: string = 'Assertion failed!'
): asserts expectedCondition {
  if (!expectedCondition) {
    console.error(message);
    throw Error(message);
  }
}

export function safe_not_equal(a: any, b: any) {
  return a != a
    ? b == b
    : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

export function subscribe(store: any, ...callbacks: ((_: any) => any)[]) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}

export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

export function isMouseEvent(event: ResizeEvent): event is MouseEvent {
  return event.type.startsWith('mouse');
}

export function isTouchEvent(event: ResizeEvent): event is TouchEvent {
  return event.type.startsWith('touch');
}

export function isKeyDown(event: ResizeEvent): event is KeyboardEvent {
  return event.type === 'keydown';
}

export function paneDataHelper(
  paneDataArray: PaneData[],
  paneData: PaneData,
  layout: number[]
) {
  const paneConstraintsArray = paneDataArray.map(
    paneData => paneData.constraints
  );

  const paneIndex = findPaneDataIndex(paneDataArray, paneData.id);
  const paneConstraints = paneConstraintsArray[paneIndex];

  const isLastPane = paneIndex === paneDataArray.length - 1;
  const pivotIndices = isLastPane
    ? [paneIndex - 1, paneIndex]
    : [paneIndex, paneIndex + 1];

  const paneSize = layout[paneIndex];

  return {
    ...paneConstraints,
    paneSize,
    pivotIndices
  };
}

export function findPaneDataIndex(
  paneDataArray: PaneData[],
  paneDataId: PaneId
) {
  return paneDataArray.findIndex(p => p.id === paneDataId);
}

export function isPaneCollapsed(
  paneDataArray: PaneData[],
  layout: number[],
  pane: PaneData
) {
  const {
    collapsedSize = 0,
    collapsible,
    paneSize
  } = paneDataHelper(paneDataArray, pane, layout);

  return collapsible === true && paneSize === collapsedSize;
}

export function isPaneExpanded(
  paneDataArray: PaneData[],
  layout: number[],
  pane: PaneData
) {
  const {
    collapsedSize = 0,
    collapsible,
    paneSize
  } = paneDataHelper(paneDataArray, pane, layout);
  return !collapsible || paneSize > collapsedSize;
}

export function tick(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      // Wait one more frame to ensure DOM is updated
      requestAnimationFrame(() => {
        resolve();
      });
    });
  });
}
