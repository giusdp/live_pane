import { LOCAL_STORAGE_DEBOUNCE_INTERVAL, type PaneData } from './core';
import { Writable } from './store';

export type PaneConfigState = {
  expandToSizes: { [paneId: string]: number };
  layout: number[];
};

export type SerializedPaneGroupState = {
  [paneIds: string]: PaneConfigState;
};

export type PaneGroupStorage = {
  getItem(name: string): string | null;
  setItem(name: string, value: string): void;
};

/**
 * Initializes the storage object with the appropriate getItem
 *  and setItem functions depending on the environment (browser or not).
 */
export function initializeStorage(storageObject: PaneGroupStorage): void {
  try {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage is not supported in this environment');
    }

    storageObject.getItem = (name: string) => localStorage.getItem(name);
    storageObject.setItem = (name: string, value: string) =>
      localStorage.setItem(name, value);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    storageObject.getItem = () => null;
    storageObject.setItem = () => {};
  }
}

/**
 * Saves the pane group state to local storage.
 */
export function savePaneGroupState(
  autoSaveId: string,
  panes: PaneData[],
  paneSizesBeforeCollapse: Map<string, number>,
  sizes: number[],
  storage: PaneGroupStorage
): void {
  const paneGroupKey = getPaneGroupKey(autoSaveId);
  const paneKey = getPaneKey(panes);
  const state = loadSerializedPaneGroupState(autoSaveId, storage) || {};
  state[paneKey] = {
    expandToSizes: Object.fromEntries(paneSizesBeforeCollapse.entries()),
    layout: sizes
  };

  try {
    storage.setItem(paneGroupKey, JSON.stringify(state));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

/**
 * Loads the pane group state from local storage.
 * If the state is not found, returns null.
 */
export function loadPaneGroupState(
  autoSaveId: string,
  panes: PaneData[],
  storage: PaneGroupStorage
): PaneConfigState | null {
  const state = loadSerializedPaneGroupState(autoSaveId, storage) || {};
  const paneKey = getPaneKey(panes);
  return state[paneKey] || null;
}

/**
 * Returns the key to use for storing the pane group state in local storage.
 */
function getPaneGroupKey(id: string): string {
  return `livepane:${id}`;
}

/**
 * Returns a key to use for storing the pane state in local storage.
 * The key is based on the pane order and constraints.
 */
function getPaneKey(panes: PaneData[]): string {
  const sortedPaneIds = panes
    .map(({ id }) => id)
    .sort()
    .join(',');
  return sortedPaneIds;
}

/**
 * Loads the serialized pane group state from local storage.
 * If the state is not found, returns null.
 */
function loadSerializedPaneGroupState(
  autoSaveId: string,
  storage: PaneGroupStorage
): SerializedPaneGroupState | null {
  try {
    const paneGroupKey = getPaneGroupKey(autoSaveId);
    const serialized = storage.getItem(paneGroupKey);
    const parsed = JSON.parse(serialized || '');
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as SerializedPaneGroupState;
    }
  } catch {
    // noop
  }

  return null;
}

const debounceMap: {
  [key: string]: typeof savePaneGroupState;
} = {};

/**
 * Returns a debounced version of the given function.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
function debounce<T extends Function>(callback: T, durationMs: number = 10) {
  let timeoutId: number | null | undefined = null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const callable = (...args: any) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      callback(...args);
    }, durationMs);
  };

  return callable as unknown as T;
}

/**
 * Updates the values in local storage based on the current state of
 * the pane group.
 * This function is debounced to limit the frequency of local storage writes.
 */
export function updateStorageValues({
  saveId,
  layout,
  storage,
  paneDataArrayStore,
  paneSizeBeforeCollapseStore
}: {
  saveId: string;
  layout: number[];
  storage: PaneGroupStorage;
  paneDataArrayStore: Writable<PaneData[]>;
  paneSizeBeforeCollapseStore: Writable<Map<string, number>>;
}) {
  const $paneDataArray = paneDataArrayStore.get();

  // If this pane has been configured to persist sizing
  // information, save sizes to local storage.

  if (layout.length === 0 || layout.length !== $paneDataArray.length) return;

  let debouncedSave = debounceMap[saveId];

  // Limit frequency of local storage writes.
  if (debouncedSave == null) {
    debouncedSave = debounce(
      savePaneGroupState,
      LOCAL_STORAGE_DEBOUNCE_INTERVAL
    );
    debounceMap[saveId] = debouncedSave;
  }

  // Clone mutable data before passing to the debounced function,
  // else we run the risk of saving an incorrect combination of mutable and immutable values to state.
  const clonedPaneDataArray = [...$paneDataArray];

  const $paneSizeBeforeCollapse = paneSizeBeforeCollapseStore.get();
  const clonedPaneSizesBeforeCollapse = new Map($paneSizeBeforeCollapse);
  debouncedSave(
    saveId,
    clonedPaneDataArray,
    clonedPaneSizesBeforeCollapse,
    layout,
    storage
  );
}
