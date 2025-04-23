import { writable, type Writable } from './store';
import type { DragState, GroupId, PaneGroupData } from './types';

export const PRECISION = 10;

export const paneGroupInstances = new Map<GroupId, PaneGroupData>();

export const dragState: Writable<DragState | null> = writable(null);
