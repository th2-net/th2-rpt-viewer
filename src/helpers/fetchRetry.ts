import fetchRetry from 'fetch-retry';
import { nanoid } from 'nanoid';
import notificationsStore from '../stores/NotificationsStore';

export default function (input: RequestInfo, init: RequestInit = {}) {
	return fetchRetry(fetch)(input, {
		retries: 3,
		retryOn: async (attempt, error, response) => {
			const retry = attempt < 2 ? error !== null : false;

			if (!retry) {
				if (response) {
					notificationsStore.handleRequestError(response);
				} else {
					const url = typeof input === 'string' ? input : input.url;
					notificationsStore.addMessage({
						id: nanoid(),
						notificationType: 'genericError',
						header: 'Something went wrong while loading data',
						description: url,
						type: 'error',
					});
				}
			}
			return retry;
		},
		...init,
	});
}
