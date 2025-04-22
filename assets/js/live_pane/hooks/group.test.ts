import test from 'ava';
import { renderHook } from '../../../test';
import { createGroupHook } from './group';
import { paneGroupInstances } from '../core';
import { createPaneHook } from './pane';

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
