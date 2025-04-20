import test from 'ava';
import { addEventListener, type GeneralEventListener } from './event';

const testCases = [
  {
    name: 'EventTarget',
    target: document.createElement('div'),
    event: 'click'
  },
  {
    name: 'Window',
    target: window,
    event: 'resize'
  },
  {
    name: 'Document',
    target: document,
    event: 'blur'
  }
];

for (const { name, target, event } of testCases) {
  test(`addEventListener adds and removes event listener on ${name}`, t => {
    let called = false;
    const handler: GeneralEventListener<Event> = () => {
      called = true;
    };

    const remove = addEventListener(
      target,
      event as keyof HTMLElementEventMap,
      handler
    );
    target.dispatchEvent(new Event(event));
    t.true(called);

    called = false;
    remove();
    target.dispatchEvent(new Event(event));
    t.false(called);
  });
}

test('addEventListener passes options to addEventListener', t => {
  const target = document.createElement('div');
  let called = false;
  const handler: GeneralEventListener<Event> = () => {
    called = true;
  };

  const remove = addEventListener(target, 'click', handler, { once: true });
  target.dispatchEvent(new Event('click'));
  t.true(called);

  called = false;
  target.dispatchEvent(new Event('click'));
  t.false(called);

  remove(); // Should be safe to call even if already removed
  t.pass();
});
