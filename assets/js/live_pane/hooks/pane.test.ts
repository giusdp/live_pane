import test from 'ava';
import { writable } from '../store';
import type { PaneData } from '../core';
import { createPaneHook } from './pane';
import { renderHook } from '../../../test';
import { createGroupHook } from './group';
import { paneGroupInstances } from '../core';

test('Mounting pane registers it to group data', t => {
  const groupHook = renderHook('<div id="a">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const groupData = paneGroupInstances.get('a');
  if (!groupData) {
    t.fail('Group data not found');
    return;
  }
  const panes = groupData.paneDataArray;
  const changed = groupData.paneDataArrayChanged;

  t.deepEqual(panes.get(), []);
  t.false(changed.get());

  const paneHook = renderHook(
    '<div data-pane-group-id="a" id="pane1">pane</div>',
    createPaneHook()
  );
  paneHook.trigger('mounted');

  const paneData = panes.get()[0];
  t.deepEqual(paneData, {
    id: 'pane1',
    order: 0,
    constraints: {
      minSize: 0,
      maxSize: 100,
      defaultSize: undefined,
      collapsedSize: 0,
      collapsible: false
    }
  });
});

test('Mounting panes registers them following data-pane-order', t => {
  const groupHook = renderHook('<div id="b">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const groupData = paneGroupInstances.get('b');
  if (!groupData) {
    t.fail('Group data not found');
    return;
  }
  const panes = groupData.paneDataArray;
  const changed = groupData.paneDataArrayChanged;

  t.deepEqual(panes.get(), []);
  t.false(changed.get());

  const pane1Hook = renderHook(
    '<div data-pane-group-id="b" id="pane1" data-pane-order=2>pane</div>',
    createPaneHook()
  );
  pane1Hook.trigger('mounted');
  const pane2Hook = renderHook(
    '<div data-pane-group-id="b" id="pane2" data-pane-order=1>pane</div>',
    createPaneHook()
  );
  pane2Hook.trigger('mounted');

  const registeredPanes = panes.get().map(p => ({ id: p.id, order: p.order }));
  t.deepEqual(registeredPanes, [
    { id: 'pane2', order: 1 },
    { id: 'pane1', order: 2 }
  ]);
});

test('destroying unregisters the panes', t => {
  const groupHook = renderHook('<div id="c">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const groupData = paneGroupInstances.get('c');
  if (!groupData) {
    t.fail('Group data not found');
    return;
  }
  const panes = groupData.paneDataArray;

  const paneHook = renderHook(
    '<div data-pane-group-id="c" id="pane1">pane</div>',
    createPaneHook()
  );
  paneHook.trigger('mounted');

  t.is(panes.get().length, 1);

  paneHook.trigger('destroyed');
  t.is(panes.get().length, 0);
});

test('Changes to layout updates the style', t => {
  const groupHook = renderHook('<div id="d">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const groupData = paneGroupInstances.get('d');
  if (!groupData) {
    t.fail('Group data not found');
    return;
  }

  const paneHook = renderHook(
    '<div data-pane-group-id="d" id="pane1">pane</div>',
    createPaneHook()
  );
  paneHook.trigger('mounted');
  renderHook(
    '<div data-pane-group-id="d" id="pane2">pane</div>',
    createPaneHook()
  ).trigger('mounted');
  const oldStyleValues = paneHook.element().style._values;
  groupData.layout.update(l => [l[0] + 20, l[1] - 20]);
  t.notDeepEqual(paneHook.element().style._values, oldStyleValues);
});
