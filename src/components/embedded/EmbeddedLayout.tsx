import { observer } from 'mobx-react-lite';
import React from 'react';
import { WorkspaceContextProvider } from '../../contexts/workspaceContext';
import { useWorkspaces } from '../../hooks';
import EmbeddedWorkspace from './EmbeddedWorkspace';

function EmbeddedLayout() {
	const { workspaces } = useWorkspaces();

	return (
		<>
			{workspaces.map(workspace => (
				<WorkspaceContextProvider value={workspace} key={workspace.id}>
					<EmbeddedWorkspace workspace={workspace} />
				</WorkspaceContextProvider>
			))}
		</>
	);
}

export default observer(EmbeddedLayout);
