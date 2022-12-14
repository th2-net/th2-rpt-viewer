/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
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

import { getObjectKeys } from 'helpers/object';
import { toJS } from 'mobx';
import { MessagesStoreURLState } from 'modules/messages/stores/MessagesStore';
import { EventStoreURLState } from 'modules/events/stores/EventsStore';
import { MultipleStringFilter } from 'models/filter/Filter';

export function createURLSearchParams(
	_params: Record<string, string | number | boolean | null | string[] | undefined>,
) {
	const params = new URLSearchParams();

	for (const [key, param] of Object.entries(_params)) {
		// eslint-disable-next-line no-continue
		if (param == null || param === '') continue;
		if (Array.isArray(param)) {
			param.forEach(p => params.append(key, p));
		} else {
			params.set(key, param.toString());
		}
	}

	return params;
}

function clearEmptyParams<T extends Record<string, unknown>>(obj: T) {
	getObjectKeys(obj).forEach((key: string) => {
		const value = obj[key];

		if (value == null || value === false || (Array.isArray(value) && value.length === 0)) {
			// eslint-disable-next-line no-param-reassign
			delete obj[key];
		}

		if (typeof value === 'object' && value !== null) {
			if ('values' in value) {
				const filter = value as MultipleStringFilter;
				if (Array.isArray(filter.values) && filter.values.length === 0) {
					// eslint-disable-next-line no-param-reassign
					delete obj[key];
				}
			}

			if (Object.keys(value).length === 0) {
				// eslint-disable-next-line no-param-reassign
				delete obj[key];
			}
		}
	});

	return obj;
}

export function getEventsUrlState(state: EventStoreURLState): EventStoreURLState {
	const urlState: EventStoreURLState = toJS(state, { recurseEverything: true });

	if (urlState.filter?.status && urlState.filter.status.values === 'All') {
		// eslint-disable-next-line no-param-reassign
		delete urlState.filter.status;
	}

	clearEmptyParams(urlState);
	clearEmptyParams(urlState.filter || {});

	return urlState;
}

export function getMessagesUrlState(state: MessagesStoreURLState): MessagesStoreURLState {
	const urlState: MessagesStoreURLState = toJS(state, { recurseEverything: true });

	clearEmptyParams(urlState);
	clearEmptyParams(urlState.filter || {});

	return urlState;
}
