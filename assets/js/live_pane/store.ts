import { Hook } from 'phoenix_live_view';
import { get_store_value, safe_not_equal } from './utils';

/** Callback to inform of a value updates. */
export type Subscriber<T> = (value: T) => void;

/** Unsubscribes from value updates. */
export type Unsubscriber = () => void;

export type Updater<T> = (value: T) => T;

/** Writable interface for both updating and subscribing. */
export interface Writable<T> {
  /**
   * Set value and inform subscribers.
   * @param value to set
   */
  set(this: void, value: T): void;

  /**
   * Update value using callback and inform subscribers.
   * @param updater callback
   */
  update(this: void, updater: Updater<T>): void;

  /**
   * Subscribe on value changes.
   * @param run subscription callback
   */
  subscribe(this: void, run: Subscriber<T | undefined>): Unsubscriber;
}

const subscriber_queue: any[] = [];

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 */
export function writable<T>(value?: T): Writable<T> {
  let active: boolean = false;
  const subscribers: Set<Subscriber<T>> = new Set();

  function set(new_value: T): void {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (active) {
        for (const subscriber of subscribers) {
          subscriber(new_value);
          subscriber_queue.push(subscriber, value);
        }
      }
    }
  }
  function update(fn: Updater<T>): void {
    set(fn(value as any));
  }

  function subscribe(subscriber: Subscriber<T | undefined>): Unsubscriber {
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      active = true;
    }
    subscriber(value);

    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        active = false;
      }
    };
  }

  return { set, update, subscribe };
}

export function hookEffect(
  hook: Hook,
  stores: any[],
  effectFn: { call: (hook: Hook, ...args: any[]) => any }
): Hook {
  let cleanup: (() => void) | null;
  let unsubscribers: Unsubscriber[] = [];

  function runEffect() {
    // unsubscribe from previous inner subscriptions
    unsubscribers.forEach(u => u());
    unsubscribers = [];

    // call global cleanup
    if (typeof cleanup === 'function') {
      cleanup();
      cleanup = null;
    }

    // get current values from each store
    const values = stores.map(store => {
      let current;
      store.subscribe((v: any) => (current = v))(); // immediately unsubscribe
      return current;
    });

    // run effect
    const maybeUnsub = effectFn.call(hook, ...values);
    if (typeof maybeUnsub === 'function') {
      cleanup = maybeUnsub;
    }
  }

  // subscribe to each store and re-run effect on change
  stores.forEach(store => {
    const unsub = store.subscribe(() => runEffect());
    unsubscribers.push(unsub);
  });

  // wrap mounted/updated/destroyed
  const origMounted = hook.mounted;
  hook.mounted = function () {
    origMounted && origMounted.call(this);
    runEffect();
  };

  const origUpdated = hook.updated;
  hook.updated = function () {
    origUpdated && origUpdated.call(this);
    runEffect();
  };

  const origDestroyed = hook.destroyed;
  hook.destroyed = function () {
    // cleanup subscriptions and effect
    unsubscribers.forEach(u => u());
    if (cleanup) cleanup();
    origDestroyed && origDestroyed.call(this);
  };

  return hook;
}

/**
 * Get the current value from a store by subscribing and immediately unsubscribing.
 * @param store readable
 */
export { get_store_value as get };
