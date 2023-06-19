import notificationsStore from '../stores/NotificationsStore';
import { JSONViewerApiSchema } from './ApiSchema';

const JSONViewerHttpApi: JSONViewerApiSchema = {
	getDirectories: async (directoriesURL: string) => {
		const res = await fetch(directoriesURL, {
			headers: {
				Accept: 'application/json, text/plain, */*',
			},
		});

		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return [];
	},
	getFiles: async (directoriesURL: string, directory: string) => {
		const res = await fetch(`${directoriesURL}/${directory}`, {
			headers: {
				Accept: 'application/json, text/plain, */*',
			},
		});

		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return [];
	},
	getFile: async (directoriesURL: string, directory: string, file: string) => {
		const res = await fetch(`${directoriesURL}/${directory}/${file}`, {
			headers: {
				Accept: 'application/json, text/plain, */*',
			},
		});

		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return {};
	},
};

export default JSONViewerHttpApi;
