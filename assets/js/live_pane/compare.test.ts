import test from 'ava';
import { areNumbersAlmostEqual, compareNumbersWithTolerance, areArraysEqual } from './compare';

test('areNumbersAlmostEqual', t => {
	t.true(areNumbersAlmostEqual(1.234567, 1.234568, 5));
	t.false(areNumbersAlmostEqual(1.2345, 1.2355, 3));
});

test('compareNumbersWithTolerance', t => {
	t.is(compareNumbersWithTolerance(2.3456, 2.3457, 3), 0);
	t.is(compareNumbersWithTolerance(9.99, 10, 2), -1);
	t.is(compareNumbersWithTolerance(1.236, 1.235, 3), 1);
});

test('areArraysEqual', t => {
	t.true(areArraysEqual([1, 2, 3], [1, 2, 3]));
	t.true(areArraysEqual([], []));

	t.false(areArraysEqual([1, 2], [1, 2, 3]));
	t.false(areArraysEqual([1, 2], [1, 4]));
	t.false(areArraysEqual([], [1]));
});