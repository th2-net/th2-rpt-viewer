import { nanoid } from 'nanoid';
import { action } from 'mobx';
import WorkspaceViewStore from './WorkspaceViewStore';
import { JSONViewerStore } from '../JSONViewerStore';
import ApiSchema from '../../api/ApiSchema';
import { getRangeFromTimestamp } from '../../helpers/date';
import WorkspacesStore from './WorkspacesStore';

export const JSON_STORE_INTERVAL = 15;

export default class JSONViewerWorkspaceStore {
	public viewStore: WorkspaceViewStore;

	public JSONviewerStore: JSONViewerStore;

	public id = nanoid();

	constructor(private workspacesStore: WorkspacesStore, api: ApiSchema) {
		this.viewStore = new WorkspaceViewStore(undefined);
		this.JSONviewerStore = new JSONViewerStore(api);
	}

	@action
	public onTimestampSelect = (timestamp: number) => {
		const range = getRangeFromTimestamp(timestamp, JSON_STORE_INTERVAL);
		const newWorkspace = this.workspacesStore.createWorkspace({
			timeRange: range,
			interval: JSON_STORE_INTERVAL,
			events: {
				range,
			},
			messages: {
				timestampTo: timestamp,
			},
		});

		newWorkspace.then(workspace => this.workspacesStore.addWorkspace(workspace));
	};
}
