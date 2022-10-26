import fetchRetry from 'fetch-retry';
import { nanoid } from 'nanoid';
import notificationsStore from '../stores/NotificationsStore';
import { isAbortError } from './fetch';

export default function (input: RequestInfo, init: RequestInit = {}) {
	return fetchRetry(fetch)(input, {
		retries: 3,
		retryOn: async (attempt, error, response) => {
			if (isAbortError(error)) return false;
			const retry = attempt < 2 ? error !== null : false;

			if (!retry) {
				if (response) {
					notificationsStore.handleRequestError(response);
				} else if (error) {
					const url = typeof input === 'string' ? input : input.url;
					notificationsStore.addMessage({
						id: nanoid(),
						notificationType: 'genericError',
						header: 'Something went wrong while loading data',
						description: `${error.message} ${url}`,
						type: 'error',
					});
				}
			}
			return retry;
		},
		...init,
	});
}
