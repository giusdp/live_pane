import { safe_not_equal } from './utils';

/** Callback to inform of a value updates. */
export type Subscriber<T> = (value: T) => void;

/** Unsubscribes from value updates. */
export type Unsubscriber = () => void;

/** Writable interface for both updating and subscribing. */
export interface Writable<T> {
  set(this: void, value: T): void;

  get(this: void): T;

  update(this: void, updater: (value: T) => T): void;

  subscribe(this: void, run: Subscriber<T>): Unsubscriber;
}

const subscriber_queue: any[] = [];

export function writable<T>(value: T): Writable<T> {
  const subscribers: Set<Subscriber<T>> = new Set();

  function set(new_value: T): void {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      for (const subscriber of subscribers) {
        subscriber(new_value);
        subscriber_queue.push(subscriber, value);
      }
    }
  }

  function get(): T {
    return value as T;
  }

  function update(fn: (value: T) => T): void {
    set(fn(value as any));
  }

  function subscribe(subscriber: Subscriber<T>): Unsubscriber {
    subscribers.add(subscriber);
    subscriber(value);

    return () => {
      subscribers.delete(subscriber);
    };
  }

  return { set, get, update, subscribe };
}
