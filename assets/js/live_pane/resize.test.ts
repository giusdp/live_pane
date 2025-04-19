import test from 'ava';
import { resizePane } from './resize';
import { PRECISION } from './constants';

test('returns size if between min and max', t => {
  const constraints = [
    {
      minSize: 50,
      maxSize: 200,
      collapsedSize: 0,
      collapsible: false
    }
  ];
  const result = resizePane({
    paneConstraintsArray: constraints,
    paneIndex: 0,
    size: 100
  });
  t.is(result, 100);
});

test('clamps to maxSize if size > maxSize', t => {
  const constraints = [
    { minSize: 50, maxSize: 120, collapsedSize: 0, collapsible: false }
  ];
  const result = resizePane({
    paneConstraintsArray: constraints,
    paneIndex: 0,
    size: 150
  });
  t.is(result, 120);
});

test('clamps to minSize if size < minSize and not collapsible', t => {
  const constraints = [
    { minSize: 40, maxSize: 200, collapsedSize: 0, collapsible: false }
  ];
  const result = resizePane({
    paneConstraintsArray: constraints,
    paneIndex: 0,
    size: 20
  });
  t.is(result, 40);
});

test('snaps to collapsedSize if collapsible and size is closer to collapsedSize', t => {
  const constraints = [
    { minSize: 40, maxSize: 200, collapsedSize: 10, collapsible: true }
  ];
  const result = resizePane({
    paneConstraintsArray: constraints,
    paneIndex: 0,
    size: 15
  });
  t.is(result, 10);
});

test('snaps to minSize if collapsible and size is closer to minSize', t => {
  const constraints = [
    { minSize: 40, maxSize: 200, collapsedSize: 10, collapsible: true }
  ];
  const result = resizePane({
    paneConstraintsArray: constraints,
    paneIndex: 0,
    size: 30
  });
  t.is(result, 40);
});

test('returns value rounded to PRECISION constant', t => {
  const expected = parseFloat((33.333333).toFixed(PRECISION));

  const constraints = [
    { minSize: 10, maxSize: 200, collapsedSize: 0, collapsible: false }
  ];
  const result = resizePane({
    paneConstraintsArray: constraints,
    paneIndex: 0,
    size: 33.333333
  });

  t.is(result, expected);
});
