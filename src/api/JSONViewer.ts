import notificationsStore from '../stores/NotificationsStore';
import { JSONViewerApiSchema } from './ApiSchema';

const JSONViewerHttpApi: JSONViewerApiSchema = {
	getLinks: async (type: string, dir?: string) => {
		const res = await fetch(`json-stream-provider/files/${type}${dir ? `?path=${dir}` : ''}`, {
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
	getResults: async (taskId: string): Promise<{ status: string; result: string }> => {
		const res = await fetch(`json-stream-provider/result?id=${taskId}`);
		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return { status: 'error', result: taskId };
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
		return { path: '', task_id: '' };
	},
	stopNotebook: async (taskId: string) => {
		const res = await fetch(`json-stream-provider/stop?id=${taskId}`, {
			method: 'POST',
		});
		if (res.ok) {
			return true;
		}
		// notificationsStore.handleRequestError(res);
		return false;
	},
};

export default JSONViewerHttpApi;
