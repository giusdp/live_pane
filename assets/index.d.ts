import type { Hook } from '../deps/phoenix_live_view'

declare const createLivePaneHooks: () => {
    groupHook: Hook
    paneHook: Hook
    resizerHook: Hook
}

export { createLivePaneHooks }