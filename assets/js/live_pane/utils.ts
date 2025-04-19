import { Writable } from './store';

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

export function get_store_value<T>(store: Writable<T>): T {
  let value: any;
  subscribe(store, _ => (value = _))();
  return value;
}

export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}
