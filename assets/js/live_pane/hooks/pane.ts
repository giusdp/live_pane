import { Hook } from 'phoenix_live_view';
import { paneGroupInstances } from '../core';
import { PaneData } from '../types';

export function createPaneHook() {
    let groupId: string | null = null;
    let paneId: string | null = null;

    let paneHook: Hook = {
        mounted() {
            groupId = this.el.getAttribute('data-pane-group-id');
            if (!groupId) {
                throw Error('Group id must exist for pane components!');
            }
            paneId = this.el.id;
            if (!paneId) {
                throw Error('Id must exist for pane components!');
            }
            const orderAttr = this.el.getAttribute('data-pane-order');
            const order = orderAttr ? Number(orderAttr) : 0;

            const groupData = paneGroupInstances.get(groupId);

            const paneData: PaneData = {
                id: this.el.id,
                order
            };

            groupData?.methods.registerPane(paneData);
            console.log('mounted pane in group', groupId);
        },

        destroyed() {
            const groupData = paneGroupInstances.get(groupId!);
            groupData?.methods.unregisterPane(paneId!)
        }
    };
    return paneHook;
}
