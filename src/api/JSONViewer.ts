import notificationsStore from '../stores/NotificationsStore';
import { JSONViewerApiSchema } from './ApiSchema';

const JSONViewerHttpApi: JSONViewerApiSchema = {
	getLinks: async () => {
		const res = await fetch(`json-stream-provider/files/all`, {
			cache: 'reload',
			headers: {
				Accept: 'application/json',
			},
		});
		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return [];
	},
	getFile: async (path: string) => {
		const res = await fetch(`json-stream-provider/result?path=${path}`, {
			headers: {
				Accept: 'application/json',
			},
		});

		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return {};
	},
	getParameters: async (path: string) => {
		const res = await fetch(`json-stream-provider/files?path=${path}`, {
			headers: {
				Accept: 'application/json',
			},
		});

		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return {};
	},
	getResults: async (path: string) => {
		const res = await fetch(`json-stream-provider/result?path=${path}`);
		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return path;
	},
	launchNotebook: async (path: string, parameters = {}) => {
		const res = await fetch(`json-stream-provider/execute?path=${path}`, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json',
			},
			body: JSON.stringify(parameters),
		});
		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return { path: '' };
	},
};

export default JSONViewerHttpApi;
