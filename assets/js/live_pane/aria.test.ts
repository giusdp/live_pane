import test from 'ava';
import type { PaneConstraints, PaneData } from './core';
import { calculateAriaValues } from './aria';

function constraints({
  minSize = 0,
  maxSize = 100,
  defaultSize = 0,
  collapsedSize = 0,
  collapsible = false
}) {
  return { minSize, maxSize, defaultSize, collapsedSize, collapsible };
}

function createPaneData(constraints: PaneConstraints): PaneData {
  return {
    id: `${idCounter++}`,
    constraints,
    order: orderCounter++
  };
}

let idCounter = 0;
let orderCounter = 0;

test.beforeEach(() => {
  idCounter = 0;
  orderCounter = 0;
});

test('should work correctly for panels with no min/max constraints', t => {
  t.deepEqual(
    calculateAriaValues({
      layout: [50, 50],
      panesArray: [
        createPaneData(constraints({})),
        createPaneData(constraints({}))
      ],
      pivotIndices: [0, 1]
    }),
    {
      valueMax: 100,
      valueMin: 0,
      valueNow: 50
    }
  );

  t.deepEqual(
    calculateAriaValues({
      layout: [20, 50, 30],
      panesArray: [
        createPaneData(constraints({})),
        createPaneData(constraints({})),
        createPaneData(constraints({}))
      ],
      pivotIndices: [0, 1]
    }),
    {
      valueMax: 100,
      valueMin: 0,
      valueNow: 20
    }
  );

  t.deepEqual(
    calculateAriaValues({
      layout: [20, 50, 30],
      panesArray: [
        createPaneData(constraints({})),
        createPaneData(constraints({})),
        createPaneData(constraints({}))
      ],
      pivotIndices: [1, 2]
    }),
    {
      valueMax: 100,
      valueMin: 0,
      valueNow: 50
    }
  );
});

test('should work correctly for panels with min/max constraints', t => {
  t.deepEqual(
    calculateAriaValues({
      layout: [25, 75],
      panesArray: [
        createPaneData(
          constraints({
            maxSize: 35,
            minSize: 10
          })
        ),
        createPaneData(constraints({}))
      ],
      pivotIndices: [0, 1]
    }),
    {
      valueMax: 35,
      valueMin: 10,
      valueNow: 25
    }
  );

  t.deepEqual(
    calculateAriaValues({
      layout: [25, 50, 25],
      panesArray: [
        createPaneData(
          constraints({
            maxSize: 35,
            minSize: 10
          })
        ),
        createPaneData(constraints({})),
        createPaneData(
          constraints({
            maxSize: 35,
            minSize: 10
          })
        )
      ],
      pivotIndices: [1, 2]
    }),
    {
      valueMax: 80,
      valueMin: 30,
      valueNow: 50
    }
  );
});
