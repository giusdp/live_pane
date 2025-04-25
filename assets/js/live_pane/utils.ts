import type { ResizeEvent } from './core';

export function noop() { }

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
  return event.type === "keydown";
}