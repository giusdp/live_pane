import { PRECISION } from './constants';
import type { PaneConstraints } from './types';
import { assert } from './utils';
import { compareNumbersWithTolerance } from './compare';

type ResizePaneArgs = {
  paneConstraintsArray: PaneConstraints[];
  paneIndex: number;
  size: number;
};
/**
 * Resizes a pane based on its constraints.
 */
export function resizePane({
  paneConstraintsArray: constraints,
  paneIndex,
  size
}: ResizePaneArgs): number {
  assert(
    constraints[paneIndex] != null,
    'Pane constraints should not be null.'
  );

  const { collapsedSize, collapsible, maxSize, minSize } =
    constraints[paneIndex];

  let newSize = size;

  if (compareNumbersWithTolerance(newSize, minSize) < 0) {
    newSize = getAdjustedSizeForCollapsible(
      newSize,
      collapsible,
      collapsedSize,
      minSize
    );
  }

  newSize = Math.min(maxSize, newSize);
  return parseFloat(newSize.toFixed(PRECISION));
}

/**
 * Adjusts the size of a pane based on its collapsible state.
 *
 * If the pane is collapsible, the size will be snapped to the collapsed size
 * or the minimum size based on the halfway point.
 */
function getAdjustedSizeForCollapsible(
  size: number,
  collapsible: boolean,
  collapsedSize: number,
  minSize: number
): number {
  if (!collapsible) return minSize;

  // Snap collapsible panes closed or open based on the halfway point.
  const halfwayPoint = (collapsedSize + minSize) / 2;
  return compareNumbersWithTolerance(size, halfwayPoint) < 0
    ? collapsedSize
    : minSize;
}
