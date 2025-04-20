import test from 'ava';
import { adjustLayoutByDelta } from './adjust-layout';

function constraints({
  minSize = 0,
  maxSize = 100,
  defaultSize = 0,
  collapsedSize = 0,
  collapsible = false
}) {
  return { minSize, maxSize, defaultSize, collapsedSize, collapsible };
}

test('Pane expanding scenarios with one sibling [1++,2]', t => {
  const testCases = [
    // Easy pane expanding
    {
      delta: 1,
      layout: [50, 50],
      expected: [51, 49],
      paneConstraintsArray: [constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: 25,
      layout: [50, 50],
      expected: [75, 25],
      paneConstraintsArray: [constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: 50,
      layout: [50, 50],
      expected: [100, 0],
      paneConstraintsArray: [constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    // Pane expanding with actual constraints
    {
      delta: 50,
      layout: [50, 50],
      expected: [60, 40],
      paneConstraintsArray: [
        constraints({ minSize: 20, maxSize: 60 }),
        constraints({ minSize: 10, maxSize: 90 })
      ],
      trigger: 'imperative-api'
    },
    {
      delta: 25,
      layout: [50, 50],
      expected: [75, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 })
      ],
      trigger: 'imperative-api'
    },
    {
      delta: 40,
      layout: [50, 50],
      expected: [95, 5],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 })
      ],
      trigger: 'imperative-api'
    },
    // Edge cases
    // Expanding from a collapsed state to less than the min size via imperative API should do nothing
    {
      delta: 5,
      layout: [10, 90],
      expected: [10, 90],
      paneConstraintsArray: [
        constraints({ collapsedSize: 10, collapsible: true, minSize: 25 }),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    // Edge cases with keyboard
    // Keyboard interactions should always expand a collapsed panel
    {
      delta: 5,
      layout: [10, 90],
      expected: [25, 75],
      paneConstraintsArray: [
        constraints({ collapsedSize: 10, collapsible: true, minSize: 25 }),
        constraints({})
      ],
      trigger: 'keyboard'
    },
    // Edge case
    // Keyboard interactions should always collapse a collapsible panel once it's at the minimum size
    {
      delta: 5,
      layout: [75, 25],
      expected: [100, 0],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsible: true, minSize: 25 })
      ],
      trigger: 'keyboard'
    },
    // Edge case
    // Expanding from a collapsed state to less than the min size via imperative API should do nothing
    {
      delta: 1,
      layout: [4, 96],
      expected: [4, 96],
      paneConstraintsArray: [
        constraints({
          collapsedSize: 4,
          collapsible: true,
          defaultSize: 15,
          maxSize: 15,
          minSize: 6
        }),
        constraints({ minSize: 5 })
      ],
      trigger: 'imperative-api'
    },
    // Edge case
    // Expanding from a collapsed state to less than the min size via keyboard should snap to min size
    {
      delta: 1,
      layout: [4, 96],
      expected: [6, 94],
      paneConstraintsArray: [
        constraints({
          collapsedSize: 4,
          collapsible: true,
          defaultSize: 15,
          maxSize: 15,
          minSize: 6
        }),
        constraints({ minSize: 5 })
      ],
      trigger: 'keyboard'
    },
    // Edge case
    // Expanding from a collapsed state to greater than the max size
    {
      delta: 25,
      layout: [4, 96],
      expected: [15, 85],
      paneConstraintsArray: [
        constraints({
          collapsedSize: 4,
          collapsible: true,
          defaultSize: 15,
          maxSize: 15,
          minSize: 6
        }),
        constraints({ minSize: 5 })
      ],
      trigger: 'imperative-api'
    },
    // Edge case
    // Expanding from a collapsed state mimicking an imperative API call
    {
      delta: 30,
      layout: [5, 95],
      expected: [35, 65],
      paneConstraintsArray: [
        constraints({
          collapsedSize: 5,
          collapsible: true,
          maxSize: 50,
          minSize: 25
        }),
        constraints({ minSize: 50 })
      ],
      trigger: 'imperative-api'
    },
    // Edge case
    // Expanding from a collapsed state mimicking a keyboard event
    {
      delta: 30,
      layout: [5, 95],
      expected: [35, 65],
      paneConstraintsArray: [
        constraints({
          collapsedSize: 5,
          collapsible: true,
          maxSize: 50,
          minSize: 25
        }),
        constraints({ minSize: 50 })
      ],
      trigger: 'keyboard'
    },
    // Edge case
    // Expanding from a collapsed state mimicking a keyboard event when there is no min size
    {
      delta: 30,
      layout: [0, 100],
      expected: [30, 70],
      paneConstraintsArray: [
        constraints({
          collapsedSize: 0,
          collapsible: true,
          maxSize: 50,
          minSize: 0
        }),
        constraints({})
      ],
      trigger: 'keyboard'
    },
    // invalid layouts – ignore invalid deltas
    {
      delta: 1,
      layout: [50, 50],
      expected: [50, 50],
      paneConstraintsArray: [constraints({ maxSize: 50 }), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: 1,
      layout: [50, 50],
      expected: [50, 50],
      paneConstraintsArray: [constraints({}), constraints({ minSize: 50 })],
      trigger: 'imperative-api'
    }
  ];

  for (const {
    delta,
    layout,
    expected,
    paneConstraintsArray,
    trigger
  } of testCases) {
    const actual = adjustLayoutByDelta({
      delta,
      layout,
      paneConstraintsArray,
      pivotIndices: [0, 1],
      trigger: trigger as 'imperative-api' | 'keyboard'
    });

    t.deepEqual(actual, expected);
  }
});

test('Pane contracting scenarios with one sibling [1--,2]', t => {
  const testCases = [
    {
      delta: -1,
      layout: [50, 50],
      expected: [49, 51],
      paneConstraintsArray: [constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: -25,
      layout: [50, 50],
      expected: [25, 75],
      paneConstraintsArray: [constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: -50,
      layout: [50, 50],
      expected: [0, 100],
      paneConstraintsArray: [constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: -50,
      layout: [50, 50],
      expected: [20, 80],
      paneConstraintsArray: [
        constraints({ minSize: 20, maxSize: 60 }),
        constraints({ minSize: 10, maxSize: 90 })
      ],
      trigger: 'imperative-api'
    },
    {
      delta: -25,
      layout: [50, 50],
      expected: [25, 75],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 }),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    {
      delta: -30,
      layout: [50, 50],
      expected: [25, 75],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 }),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    {
      delta: -36,
      layout: [50, 50],
      expected: [5, 95],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 }),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    // Edge case
    // The second panel should prevent the first panel from collapsing
    {
      delta: -30,
      layout: [50, 50],
      expected: [25, 75],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 }),
        constraints({ maxSize: 80 })
      ],
      trigger: 'imperative-api'
    },
    // Edge case
    // Keyboard interactions should always expand a collapsed panel
    {
      delta: -5,
      layout: [90, 10],
      expected: [75, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 10, collapsible: true, minSize: 25 })
      ],
      trigger: 'keyboard'
    },
    // Edge case
    // Keyboard interactions should always collapse a collapsible panel once it's at the minimum size
    {
      delta: -5,
      layout: [25, 75],
      expected: [10, 90],
      paneConstraintsArray: [
        constraints({ collapsedSize: 10, collapsible: true, minSize: 25 }),
        constraints({})
      ],
      trigger: 'keyboard'
    }
  ];

  for (const {
    delta,
    layout,
    expected,
    paneConstraintsArray,
    trigger
  } of testCases) {
    const actual = adjustLayoutByDelta({
      delta,
      layout,
      paneConstraintsArray,
      pivotIndices: [0, 1],
      trigger: trigger as 'imperative-api' | 'keyboard'
    });

    t.deepEqual(actual, expected);
  }
});

test('Pane expanding with multiple siblings [1++,2,3...]', t => {
  const testCases = [
    {
      delta: 1,
      layout: [25, 50, 25],
      expected: [26, 49, 25],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: 25,
      layout: [25, 50, 25],
      expected: [50, 25, 25],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: 50,
      layout: [25, 50, 25],
      expected: [75, 0, 25],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: 75,
      layout: [25, 50, 25],
      expected: [100, 0, 0],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    //  max reached remains same
    {
      delta: 25,
      layout: [25, 50, 25],
      expected: [35, 40, 25],
      paneConstraintsArray: [
        constraints({ maxSize: 35 }),
        constraints({ minSize: 25 }),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    // collapsing neighbor
    {
      delta: 5,
      layout: [25, 40, 35],
      expected: [30, 35, 35],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 }),
        constraints({ minSize: 25 })
      ],
      trigger: 'imperative-api'
    },
    // snap-to-collapse neighbor
    {
      delta: 26,
      layout: [25, 40, 35],
      expected: [60, 5, 35],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 }),
        constraints({ minSize: 25 })
      ],
      trigger: 'imperative-api'
    },
    // collapse to min & redistribute
    {
      delta: 80,
      layout: [25, 40, 35],
      expected: [70, 5, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 25 }),
        constraints({ minSize: 25 })
      ],
      trigger: 'imperative-api'
    },
    // [1++,2,3,4] – massive delta with mins
    {
      delta: 100,
      layout: [25, 25, 25, 25],
      expected: [70, 10, 10, 10],
      paneConstraintsArray: [
        constraints({}),
        constraints({ minSize: 10 }),
        constraints({ minSize: 10 }),
        constraints({ minSize: 10 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1++,2,3,4] – collapse three
    {
      delta: 10,
      layout: [25, 25, 25, 25],
      expected: [35, 20, 20, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 })
      ],
      trigger: 'imperative-api'
    },
    // [1++,2,3,4] – further collapse three
    {
      delta: 15,
      layout: [25, 25, 25, 25],
      expected: [45, 5, 25, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 })
      ],
      trigger: 'imperative-api'
    },
    // [1++,2,3,4] – collapse two to min
    {
      delta: 40,
      layout: [25, 25, 25, 25],
      expected: [65, 5, 5, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 })
      ],
      trigger: 'imperative-api'
    },
    // [1++,2,3,4] – collapse all three
    {
      delta: 100,
      layout: [25, 25, 25, 25],
      expected: [85, 5, 5, 5],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 })
      ],
      trigger: 'imperative-api'
    },
    // Edge case (react resizable panels issues/311) – fallback to previous valid layout
    {
      delta: 1,
      layout: [5, 15, 40, 40],
      expected: [5, 15, 40, 40],
      paneConstraintsArray: [
        constraints({
          collapsedSize: 5,
          collapsible: true,
          minSize: 15,
          maxSize: 20
        }),
        constraints({ minSize: 15, maxSize: 30 }),
        constraints({ minSize: 30 }),
        constraints({ minSize: 20, maxSize: 40 })
      ],
      trigger: 'imperative-api'
    }
  ];

  for (const {
    delta,
    layout,
    expected,
    paneConstraintsArray,
    trigger
  } of testCases) {
    const actual = adjustLayoutByDelta({
      delta,
      layout,
      paneConstraintsArray,
      pivotIndices: [0, 1],
      trigger: trigger as 'imperative-api' | 'keyboard'
    });

    t.deepEqual(actual, expected);
  }
});

test('Pane contracting with multiple siblings [1--,2,3...]', t => {
  const testCases = [
    {
      delta: -1,
      layout: [25, 50, 25],
      expected: [24, 51, 25],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    {
      delta: -25,
      layout: [25, 50, 25],
      expected: [0, 75, 25],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      trigger: 'imperative-api'
    },
    // first has minSize
    {
      delta: -1,
      layout: [25, 50, 25],
      expected: [24, 51, 25],
      paneConstraintsArray: [
        constraints({ minSize: 20 }),
        constraints({}),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    // first hits minSize
    {
      delta: -10,
      layout: [25, 50, 25],
      expected: [20, 55, 25],
      paneConstraintsArray: [
        constraints({ minSize: 20 }),
        constraints({}),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    {
      delta: -5,
      layout: [25, 50, 25],
      expected: [20, 55, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ maxSize: 70 }),
        constraints({ maxSize: 20 })
      ],
      trigger: 'imperative-api'
    },
    // implied minSize 10 on first
    {
      delta: -20,
      layout: [25, 50, 25],
      expected: [10, 65, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ maxSize: 70 }),
        constraints({ maxSize: 20 })
      ],
      trigger: 'imperative-api'
    },
    // collapsible first
    {
      delta: -10,
      layout: [25, 50, 25],
      expected: [15, 60, 25],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 15 }),
        constraints({}),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    // collapse fully first
    {
      delta: -20,
      layout: [25, 50, 25],
      expected: [5, 70, 25],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 15 }),
        constraints({}),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    // expand third
    {
      delta: -20,
      layout: [45, 50, 5],
      expected: [25, 50, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ maxSize: 50 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 15 })
      ],
      trigger: 'imperative-api'
    },

    // [1--,2,3,4] – controversial: blocked by 2nd max, 3rd free
    {
      delta: -10,
      layout: [25, 25, 25, 25],
      expected: [20, 30, 25, 25],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ maxSize: 30 }),
        constraints({}),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    // [1--,2,3,4] – controversial with 3rd max
    {
      delta: -10,
      layout: [25, 25, 25, 25],
      expected: [20, 30, 25, 25],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ maxSize: 30 }),
        constraints({ maxSize: 35 }),
        constraints({})
      ],
      trigger: 'imperative-api'
    },
    // [1--,2,3,4] – Edge case (react resizable panels issues/210)
    {
      delta: -10,
      layout: [25, 25, 25, 25],
      expected: [20, 30, 25, 25],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ maxSize: 35 }),
        constraints({ maxSize: 35 }),
        constraints({ maxSize: 35 })
      ],
      trigger: 'imperative-api'
    },
    // [1--,2,3,4] – collapse multiple when halfway
    {
      delta: -20,
      layout: [25, 25, 25, 25],
      expected: [5, 35, 35, 25],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ maxSize: 35 }),
        constraints({ maxSize: 35 }),
        constraints({ maxSize: 35 })
      ],
      trigger: 'imperative-api'
    },
    // Edge case (react resizable panels issues/311) – recollapse in one drag
    {
      delta: -3,
      layout: [5, 15, 40, 40],
      expected: [5, 15, 40, 40],
      paneConstraintsArray: [
        constraints({
          collapsedSize: 5,
          collapsible: true,
          minSize: 15,
          maxSize: 20
        }),
        constraints({ minSize: 15, maxSize: 30 }),
        constraints({ minSize: 30 }),
        constraints({ minSize: 20, maxSize: 40 })
      ],
      trigger: 'imperative-api'
    }
  ];

  for (const {
    delta,
    layout,
    expected,
    paneConstraintsArray,
    trigger
  } of testCases) {
    const actual = adjustLayoutByDelta({
      delta,
      layout,
      paneConstraintsArray,
      pivotIndices: [0, 1],
      trigger: trigger as 'imperative-api' | 'keyboard'
    });

    t.deepEqual(actual, expected);
  }
});

test('Middle panes expanding with multiple siblings [1,2++,3++...]', t => {
  const testCases = [
    {
      delta: 1,
      layout: [25, 50, 25],
      expected: [25, 51, 24],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    {
      delta: 25,
      layout: [25, 50, 25],
      expected: [25, 75, 0],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // with minSize
    {
      delta: 5,
      layout: [25, 50, 25],
      expected: [25, 55, 20],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ minSize: 15 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // hit minSize collapse
    {
      delta: 20,
      layout: [25, 50, 25],
      expected: [25, 60, 15],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ minSize: 15 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // collapsible third
    {
      delta: 5,
      layout: [25, 50, 25],
      expected: [25, 55, 20],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ collapsible: true, minSize: 20 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // collapse third on bigger delta
    {
      delta: 10,
      layout: [25, 50, 25],
      expected: [25, 55, 20],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ collapsible: true, minSize: 20 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // full collapse third
    {
      delta: 16,
      layout: [25, 50, 25],
      expected: [25, 75, 0],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ collapsible: true, minSize: 20 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },

    // [1,2++,3,4]
    {
      delta: 10,
      layout: [25, 25, 25, 25],
      expected: [25, 35, 15, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2++,3,4]
    {
      delta: 30,
      layout: [25, 25, 25, 25],
      expected: [25, 55, 0, 20],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2++,3,4]
    {
      delta: 50,
      layout: [25, 25, 25, 25],
      expected: [25, 75, 0, 0],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2++,3,4] – blocked by second max
    {
      delta: 50,
      layout: [25, 25, 25, 25],
      expected: [65, 35, 0, 0],
      paneConstraintsArray: [
        constraints({}),
        constraints({ maxSize: 35 }),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2++,3,4] – min on third
    {
      delta: 50,
      layout: [25, 25, 25, 25],
      expected: [25, 55, 20, 0],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ minSize: 20 }),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2++,3,4] – collapsible fourth
    {
      delta: 10,
      layout: [25, 25, 25, 25],
      expected: [25, 35, 15, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 10 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2++,3,4] – expand third
    {
      delta: 30,
      layout: [25, 25, 25, 25],
      expected: [25, 55, 5, 15],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 10 }),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2++,3,4] – hit min on fourth
    {
      delta: 50,
      layout: [25, 25, 25, 25],
      expected: [25, 60, 5, 10],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 10 }),
        constraints({ minSize: 10 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },

    // [1,2,3++,4]
    {
      delta: 10,
      layout: [25, 25, 25, 25],
      expected: [25, 25, 35, 15],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3++,4]
    {
      delta: 30,
      layout: [25, 25, 25, 25],
      expected: [25, 25, 50, 0],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3++,4] – blocked by third max
    {
      delta: 30,
      layout: [25, 25, 25, 25],
      expected: [25, 35, 40, 0],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ maxSize: 40 }),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3++,4] – min on fourth
    {
      delta: 30,
      layout: [25, 25, 25, 25],
      expected: [25, 25, 40, 10],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({ minSize: 10 })
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3++,4] – collapsible fourth
    {
      delta: 5,
      layout: [25, 25, 25, 25],
      expected: [25, 25, 30, 20],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 })
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3++,4] – collapse fourth partially
    {
      delta: 50,
      layout: [25, 25, 25, 25],
      expected: [25, 25, 45, 5],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 })
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    }
  ];

  for (const {
    delta,
    layout,
    expected,
    paneConstraintsArray,
    pivotIndices,
    trigger
  } of testCases) {
    const actual = adjustLayoutByDelta({
      delta,
      layout,
      paneConstraintsArray,
      pivotIndices: pivotIndices,
      trigger: trigger as 'imperative-api' | 'keyboard'
    });

    t.deepEqual(actual, expected);
  }
});

test('Middle panes contracting with multiple siblings [1,2--,3--...]', t => {
  const testCases = [
    {
      delta: -1,
      layout: [25, 50, 25],
      expected: [25, 49, 26],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    {
      delta: -25,
      layout: [25, 50, 25],
      expected: [25, 25, 50],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    {
      delta: -50,
      layout: [25, 50, 25],
      expected: [25, 0, 75],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    {
      delta: -75,
      layout: [25, 50, 25],
      expected: [0, 0, 100],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // neighbor minSize
    {
      delta: -20,
      layout: [25, 50, 25],
      expected: [15, 40, 45],
      paneConstraintsArray: [
        constraints({}),
        constraints({ minSize: 40 }),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // maxSize on third
    {
      delta: -10,
      layout: [25, 50, 25],
      expected: [25, 45, 30],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({ maxSize: 30 })
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // collapsible second
    {
      delta: -35,
      layout: [25, 50, 25],
      expected: [20, 20, 60],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // full collapse second
    {
      delta: -40,
      layout: [25, 50, 25],
      expected: [25, 5, 70],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // collapse first neighbor of zero
    {
      delta: -10,
      layout: [25, 0, 75],
      expected: [20, 0, 80],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // full collapse first neighbor of zero
    {
      delta: -20,
      layout: [25, 0, 75],
      expected: [5, 0, 95],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // Edge case: mouse-or-touch edge
    {
      delta: -100,
      layout: [100 / 3, 100 / 3, 100 / 3],
      expected: [0, 0, 100],
      paneConstraintsArray: [constraints({}), constraints({}), constraints({})],
      pivotIndices: [1, 2],
      trigger: 'mouse-or-touch'
    },
    // [1,2--,3,4]
    {
      delta: -25,
      layout: [25, 25, 25, 25],
      expected: [25, 0, 50, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2--,3,4]
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [0, 0, 75, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2--,3,4] – second minSize
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [0, 20, 55, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ minSize: 20 }),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2--,3,4] – first minSize
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [20, 0, 55, 25],
      paneConstraintsArray: [
        constraints({ minSize: 20 }),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2--,3,4] – two mins
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [20, 20, 35, 25],
      paneConstraintsArray: [
        constraints({ minSize: 20 }),
        constraints({ minSize: 20 }),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2--,3,4] – collapsible first
    {
      delta: -5,
      layout: [25, 25, 25, 25],
      expected: [25, 20, 30, 25],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2--,3,4] – collapse fully first
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [5, 0, 70, 25],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },
    // [1,2--,3,4] – collapse second to collapsedSize
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [0, 5, 70, 25],
      paneConstraintsArray: [
        constraints({}),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [1, 2],
      trigger: 'imperative-api'
    },

    // [1,2,3--,4]
    {
      delta: -10,
      layout: [25, 25, 25, 25],
      expected: [25, 25, 15, 35],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3--,4]
    {
      delta: -40,
      layout: [25, 25, 25, 25],
      expected: [25, 10, 0, 65],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3--,4]
    {
      delta: -100,
      layout: [25, 25, 25, 25],
      expected: [0, 0, 0, 100],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3--,4] – all minSizes
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [10, 10, 10, 70],
      paneConstraintsArray: [
        constraints({ minSize: 10 }),
        constraints({ minSize: 10 }),
        constraints({ minSize: 10 }),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3--,4] – max on fourth
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [25, 25, 10, 40],
      paneConstraintsArray: [
        constraints({}),
        constraints({}),
        constraints({}),
        constraints({ maxSize: 40 })
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3--,4] – second minSize
    {
      delta: -50,
      layout: [25, 25, 25, 25],
      expected: [20, 5, 0, 75],
      paneConstraintsArray: [
        constraints({}),
        constraints({ minSize: 5 }),
        constraints({}),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3--,4] – collapse three to collapsedSize
    {
      delta: -100,
      layout: [25, 25, 25, 25],
      expected: [5, 5, 5, 85],
      paneConstraintsArray: [
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    },
    // [1,2,3--,4] – mixed collapse/min
    {
      delta: -100,
      layout: [25, 25, 25, 25],
      expected: [20, 5, 20, 55],
      paneConstraintsArray: [
        constraints({ minSize: 20 }),
        constraints({ collapsedSize: 5, collapsible: true, minSize: 20 }),
        constraints({ minSize: 20 }),
        constraints({})
      ],
      pivotIndices: [2, 3],
      trigger: 'imperative-api'
    }
  ];

  for (const {
    delta,
    layout,
    expected,
    paneConstraintsArray,
    pivotIndices,
    trigger
  } of testCases) {
    const actual = adjustLayoutByDelta({
      delta,
      layout,
      paneConstraintsArray,
      pivotIndices: pivotIndices,
      trigger: trigger as 'imperative-api' | 'keyboard' | 'mouse-or-touch'
    });

    t.deepEqual(actual, expected);
  }
});
