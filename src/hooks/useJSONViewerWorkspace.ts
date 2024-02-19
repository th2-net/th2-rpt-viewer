import { useWorkspaces } from './useWorkspacesStore';

export default function useJSONViewerWorkspace() {
	const workspacesStore = useWorkspaces();

	return workspacesStore.JSONViewerWorkspace;
}
