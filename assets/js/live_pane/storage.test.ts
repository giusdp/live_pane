import test from 'ava';
import {
  initializeStorage,
  loadPaneGroupState,
  savePaneGroupState,
  type PaneGroupStorage
} from './storage';
import type { PaneData } from './core';

function constraints({
  minSize = 0,
  maxSize = 100,
  defaultSize = 0,
  collapsedSize = 0,
  collapsible = false
}) {
  return { minSize, maxSize, defaultSize, collapsedSize, collapsible };
}

function mockStorage(): {
  storage: Record<string, string>;
  api: PaneGroupStorage;
} {
  const storage: Record<string, string> = {};
  return {
    storage,
    api: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => {
        storage[key] = value;
      }
    }
  };
}

test('initializeStorage sets getItem/setItem to localStorage if available', t => {
  const origLocalStorage = globalThis.localStorage;
  const myStorage: Record<string, string> = {};
  // @ts-ignore
  globalThis.localStorage = {
    getItem: (k: string) => myStorage[k] ?? null,
    setItem: (k: string, v: string) => (myStorage[k] = v)
  };
  const storage: PaneGroupStorage = {
    getItem: () => null,
    setItem: () => {}
  };
  initializeStorage(storage);
  storage.setItem('foo', 'bar');
  t.is(storage.getItem('foo'), 'bar');
  // @ts-ignore
  globalThis.localStorage = origLocalStorage;
});

test('savePaneGroupState and loadPaneGroupState roundtrip', t => {
  const { api } = mockStorage();
  const panes: PaneData[] = [
    { id: 'a', order: 1, constraints: constraints({}) },
    { id: 'b', order: 2, constraints: constraints({}) }
  ];
  const paneSizes = new Map([
    ['a', 100],
    ['b', 200]
  ]);
  const sizes = [0.5, 0.5];
  savePaneGroupState('test', panes, paneSizes, sizes, api);

  const loaded = loadPaneGroupState('test', panes, api);
  t.truthy(loaded);
  t.deepEqual(loaded!.expandToSizes, { a: 100, b: 200 });
  t.deepEqual(loaded!.layout, [0.5, 0.5]);
});

test('loadPaneGroupState returns null if nothing saved', t => {
  const { api } = mockStorage();
  const panes: PaneData[] = [
    { id: 'x', order: 1, constraints: constraints({}) }
  ];
  t.is(loadPaneGroupState('nope', panes, api), null);
});

test('loadPaneGroupState returns null if storage is invalid', t => {
  const { api, storage } = mockStorage();
  storage['livepane:bad'] = 'not-json';
  const panes: PaneData[] = [
    { id: 'a', order: 1, constraints: constraints({}) }
  ];
  t.is(loadPaneGroupState('bad', panes, api), null);
});

test('savePaneGroupState overwrites previous state for same key', t => {
  const { api } = mockStorage();
  const panes: PaneData[] = [
    { id: 'a', order: 1, constraints: constraints({}) }
  ];
  const paneSizes1 = new Map([['a', 1]]);
  const paneSizes2 = new Map([['a', 2]]);
  savePaneGroupState('overwrite', panes, paneSizes1, [1], api);
  savePaneGroupState('overwrite', panes, paneSizes2, [2], api);
  const loaded = loadPaneGroupState('overwrite', panes, api);
  t.deepEqual(loaded!.expandToSizes, { a: 2 });
  t.deepEqual(loaded!.layout, [2]);
});
