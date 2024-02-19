import notificationsStore from '../stores/NotificationsStore';
import { JSONViewerApiSchema } from './ApiSchema';

const directoriesURL = '/resources/';

const JSONViewerHttpApi: JSONViewerApiSchema = {
	getLinks: async (dir?: string) => {
		const res = await fetch(`${directoriesURL}${dir || ''}`, {
			cache: 'reload',
			headers: {
				Accept: 'application/json, text/plain, */*',
			},
		});
		if (res.ok) {
			const text = await res.text();
			const links: string[] = [];
			let tempText = text.slice();
			const linkStartInf = `a href="`;
			let linkStart = tempText.indexOf(linkStartInf);
			while (linkStart > -1) {
				tempText = tempText.slice(linkStart + linkStartInf.length);
				const linkEnd = tempText.indexOf(`"`);
				const link = tempText.slice(0, linkEnd);
				links.push(link);
				linkStart = tempText.indexOf(linkStartInf);
			}
			return links;
		}
		notificationsStore.handleRequestError(res);
		return [];
	},
	getFile: async (directory: string, file: string) => {
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
