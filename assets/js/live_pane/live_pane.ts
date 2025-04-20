import type { Hook } from 'phoenix_live_view';
import { createGroupHook } from './hooks/group';
import { createPaneHook } from './hooks/pane';
import { createResizerHook } from './hooks/resizer';

export function createLivePaneHooks() {
  let groupHook: Hook = createGroupHook();
  let paneHook: Hook = createPaneHook();
  let resizerHook: Hook = createResizerHook();

  return { groupHook, paneHook, resizerHook };
}
