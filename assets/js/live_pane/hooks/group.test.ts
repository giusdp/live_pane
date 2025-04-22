import test from 'ava';
import { writable } from '../store';
import type { PaneData } from '../types';
import { createPaneHook } from './pane';
import { renderHook } from '../../../test';
import { createGroupHook } from './group';
import { paneGroupInstances } from '../core';

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
