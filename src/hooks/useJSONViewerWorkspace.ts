import React from 'react';
import JSONViewerWorkspaceStore from '../stores/workspace/JSONViewerWorkspaceStore';
import { JSONViewWorspaceContext } from '../contexts/JSONViewWorspaceContextProvider';

export const useJSONViewerWorkspace = (): JSONViewerWorkspaceStore => {
	const workspaceStore = React.useContext(JSONViewWorspaceContext);

	if (!workspaceStore) {
		throw new Error('WorkspaceContext should be used inside of JSONViewWorspaceContextProvider');
	}

	return workspaceStore;
};
