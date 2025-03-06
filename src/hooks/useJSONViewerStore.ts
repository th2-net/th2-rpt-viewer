import { useJSONViewerWorkspace } from './useJSONViewerWorkspace';

export const useJSONViewerStore = () => {
	const JSONViewerWorkspace = useJSONViewerWorkspace();

	return JSONViewerWorkspace.JSONviewerStore;
};
