import test from 'ava';
import { writable } from './store';

test('initial get returns the initial value', t => {
  const store = writable<number>(42);
  t.is(store.get(), 42);
});

test('set updates the stored value', t => {
  const store = writable<number>(10);
  store.set(20);
  t.is(store.get(), 20);
});

test('update applies updater function and changes the value', t => {
  const store = writable<number>(5);
  store.update(n => n * 2);
  t.is(store.get(), 10);
});

test('subscribe invokes callback with initial value and unsubscribes correctly', t => {
  const store = writable<number>(3);
  const calls: number[] = [];
  const unsub = store.subscribe(value => calls.push(value));

  t.deepEqual(calls, [3]);

  // On change
  store.set(4);
  t.deepEqual(calls, [3, 4]);

  unsub();
  store.set(5);
  t.deepEqual(calls, [3, 4]);
});
