import test from 'ava';
import { renderHook } from '../../../test';
import { createGroupHook } from './group';
import { LOCAL_STORAGE_DEBOUNCE_INTERVAL, paneGroupInstances } from '../core';
import { createPaneHook } from './pane';
import { initializeStorage, type PaneGroupStorage } from '../storage';

test('Mounting group registers it in the group instances map', t => {
  const groupHook = createGroupHook();
  t.is(paneGroupInstances.size, 0);

  const hook = renderHook('<div id="a">group</div>', groupHook);
  hook.trigger('mounted');

  t.is(paneGroupInstances.size, 1);
});

test('Mounting group without id throws error', t => {
  const groupHook = createGroupHook();
  const hook = renderHook('<div>group</div>', groupHook);
  t.throws(() => hook.trigger('mounted'));
});

test('Group updates layout on pane changes', t => {
  const groupHook = renderHook('<div id="b">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const groupData = paneGroupInstances.get('b');
  if (!groupData) {
    t.fail('Group data not found');
    return;
  }
  t.deepEqual(groupData.layout.get(), []);
  const pane1Hook = renderHook(
    '<div data-pane-group-id="b" id="pane1">pane</div>',
    createPaneHook()
  );
  pane1Hook.trigger('mounted');
  t.deepEqual(groupData.layout.get(), [100]);

  const pane2Hook = renderHook(
    '<div data-pane-group-id="b" id="pane2">pane</div>',
    createPaneHook()
  );
  pane2Hook.trigger('mounted');

  t.deepEqual(groupData.layout.get(), [50, 50]);
});

test('Mounting group with explicit direction sets it correctly', t => {
  const hook = renderHook(
    '<div id="c" data-pane-direction="vertical">group</div>',
    createGroupHook()
  );
  hook.trigger('mounted');

  const groupData = paneGroupInstances.get('c');
  t.is(groupData!.direction.get(), 'vertical');
});

test('Destroying group removes it from the group instances map', t => {
  const groupHook = renderHook('<div id="d">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  t.true(paneGroupInstances.has('d'));

  groupHook.trigger('destroyed');
  t.false(paneGroupInstances.has('d'));
});

test('Updating layout with save state active stores the state', t => {
  const origLocalStorage = globalThis.localStorage;
  const myStorage: Record<string, string> = {};
  // @ts-ignore
  globalThis.localStorage = {
    getItem: (k: string) => {
      t.is(k, 'livepane:e');
      return myStorage[k] ?? null;
    },
    setItem: (k: string, v: string) => {
      t.is(k, 'livepane:e');
      t.is(v, '{"pane1,pane2":{"expandToSizes":{},"layout":[30,70]}}');
      myStorage[k] = v;
    }
  };
  const groupHook = renderHook(
    '<div id="e" auto-save="true">group</div>',
    createGroupHook()
  );
  groupHook.trigger('mounted');

  const groupData = paneGroupInstances.get('e')!;

  renderHook(
    '<div data-pane-group-id="e" id="pane1">pane</div>',
    createPaneHook()
  ).trigger('mounted');

  renderHook(
    '<div data-pane-group-id="e" id="pane2">pane</div>',
    createPaneHook()
  ).trigger('mounted');

  groupData.layout.set([30, 70]);
});
