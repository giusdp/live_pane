import test from 'ava';
import { renderHook } from '../../../test';
import { createGroupHook } from './group';
import { paneGroupInstances } from '../core';
import { createResizerHook } from './resizer';
import { resizerInstances } from '../core';

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

test('Mounting resizer with valid data registers it to its group data (sets dragHandleId)', t => {
  const groupHook = renderHook('<div id="a">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const groupData = paneGroupInstances.get('a');
  t.is(groupData!.dragHandleId, '');

  const resizerHook = renderHook(
    '<div data-pane-group-id="a" id="resizer1">resizer</div>',
    createResizerHook()
  );
  resizerHook.trigger('mounted');

  t.is(groupData!.dragHandleId, 'resizer1');
});

test('Mounting resizer registers it to the resizerInstances map', t => {
  const groupHook = renderHook('<div id="b">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const resizerHook = renderHook(
    '<div data-pane-group-id="b" id="resizer1">resizer</div>',
    createResizerHook()
  );
  resizerHook.trigger('mounted');

  t.true(resizerInstances.has('resizer1'));
  const resizerData = resizerInstances.get('resizer1');
  t.is(resizerData!.disabled.get(), false);
  t.is(resizerData!.isDragging.get(), false);
  t.not(resizerData!.resizeHandlerCallback, null);
  t.is(resizerData!.unsubs.length, 1);
});

test('Resizer gets removed on destroy', t => {
  const groupHook = renderHook('<div id="c">group</div>', createGroupHook());
  groupHook.trigger('mounted');

  const resizerHook = renderHook(
    '<div data-pane-group-id="c" id="resizer1">resizer</div>',
    createResizerHook()
  );
  resizerHook.trigger('mounted');

  resizerHook.trigger('destroyed');

  t.false(resizerInstances.has('resizer1'));
});
