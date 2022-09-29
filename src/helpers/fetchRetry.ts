import fetchRet from 'fetch-retry';

export default function (input: RequestInfo, init?: RequestInit) {
	return fetchRet(fetch)(input, { retries: 5 });
}
