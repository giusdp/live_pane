import test from 'ava';
import { writable } from '../store';
import type { PaneData, ResizeEvent } from '../types';
import { createPaneHook } from './pane';
import { renderHook } from '../../../test';
import { createGroupHook } from './group';
import { paneGroupInstances } from '../core';
import { createResizerHook } from './resizer';

test('Mounting resizer without data-pane-group-id throws error', t => {
  const hook = renderHook('<div>resizer</div>', createResizerHook());
  t.throws(() => hook.trigger('mounted'));
});

test('Mounting resizer without id throws error', t => {
  const hook = renderHook(
    '<div data-pane-group-id="123">resizer</div>',
    createResizerHook()
  );
  t.throws(() => hook.trigger('mounted'));
});

test('Mounting resizer without corresponding group throws error', t => {
  const hook = renderHook(
    '<div data-pane-group-id="123" id="resizer1">resizer</div>',
    createResizerHook()
  );
  t.throws(() => hook.trigger('mounted'));
});

test('Mounting resizer with valid data registers it to group data (sets dragHandleId)', t => {
  const groupHook = renderHook('<div id="a">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const groupData = paneGroupInstances.get('a');
  t.is(groupData!.props.dragHandleId, '');

  const resizerHook = renderHook(
    '<div data-pane-group-id="a" id="resizer1">resizer</div>',
    createResizerHook()
  );
  resizerHook.trigger('mounted');

  t.is(groupData!.props.dragHandleId, 'resizer1');
});
