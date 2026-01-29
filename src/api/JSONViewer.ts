/** *****************************************************************************
 * Copyright 2024-2026 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

import notificationsStore from '../stores/NotificationsStore';
import { JSONViewerApiSchema } from './ApiSchema';

const baseUrl = 'json-stream-provider';

const JSONViewerHttpApi: JSONViewerApiSchema = {
	formatImageLink: (path: string) => `${baseUrl}/image?path=${path}`,
	getLinks: async (type: string, dir?: string) => {
		const res = await fetch(`${baseUrl}/files/${type}${dir ? `?path=${dir}` : ''}`, {
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
		const res = await fetch(`${baseUrl}/files?path=${path}`, {
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
		const res = await fetch(`${baseUrl}/result?id=${taskId}`);
		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return { status: 'error', result: taskId };
	},
	getFile: async (path: string): Promise<{ result: string }> => {
		const res = await fetch(`${baseUrl}/file?path=${path}`);
		if (res.ok) {
			return res.json();
		}
		notificationsStore.handleRequestError(res);
		return { result: '' };
	},
	launchNotebook: async (path: string, parameters = {}) => {
		const res = await fetch(`${baseUrl}/execute?path=${path}`, {
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
		const res = await fetch(`${baseUrl}/stop?id=${taskId}`, {
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
