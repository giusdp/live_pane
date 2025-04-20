import test from 'ava';
import { chain, type Callback } from './chain';

test('chain calls all callbacks in order with arguments', t => {
  const calls: Array<[string, number]> = [];
  const cb1: Callback<[string, number]> = (a, b) => {
    calls.push([a, b]);
  };
  const cb2: Callback<[string, number]> = (a, b) => {
    calls.push([a, b]);
  };

  const chained = chain(cb1, cb2);
  chained('foo', 42);

  t.deepEqual(calls, [
    ['foo', 42],
    ['foo', 42]
  ]);
});

test('chain works with single callback', t => {
  let called = false;
  const cb: Callback<[number]> = n => {
    called = n === 1;
  };

  const chained = chain(cb);
  chained(1);

  t.true(called);
});

test('chain skips non-function values', t => {
  let called = false;
  const chained = chain(() => {
    called = true;
    // @ts-expect-error purposely passing a non-function
  }, null);
  chained();

  t.true(called);
});
