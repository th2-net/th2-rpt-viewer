import { useWorkspaces } from './useWorkspacesStore';

export const useJSONViewerStore = () => {
	const workspacesStore = useWorkspaces();

	return workspacesStore.JSONViewerWorkspace.JSONviewerStore;
};
