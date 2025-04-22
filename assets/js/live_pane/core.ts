import { areArraysEqual, areNumbersAlmostEqual } from './compare';
import { resizePane } from './resize';
import { Writable } from './store';
import { GroupId, PaneConstraints, PaneData, PaneGroupData } from './types';
import { assert } from './utils';

export const paneGroupInstances = new Map<GroupId, PaneGroupData>();

// function getPaneStyleFn(paneDataArray: PaneData[], paneDataId: PaneId) {
//   const paneIndex = findPaneDataIndex(paneDataArray, paneDataId);
//   return (paneData: PaneData, defaultSize: number | undefined) => {
//     return computePaneFlexBoxStyle({
//       defaultSize,
//       dragState: $dragState,
//       layout: $layout,
//       paneData: $paneDataArray,
//       paneIndex,
//     });
//   }
// }
