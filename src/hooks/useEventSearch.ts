/** *****************************************************************************
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

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDebouncedCallback } from 'hooks/useDebouncedCallback';
import { EventTreeNode } from 'models/EventAction';
import moment from 'moment';
import api from 'api/index';

// TODO: it should accept queryParams instead of hardcoded name filter
export const useEventsSearch = (parentEventName: string) => {
	const sseChannel = useRef<EventSource | null>(null);

	const [events, setEvents] = useState<EventTreeNode[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	useEffect(() => {
		startSearch(parentEventName);
	}, [parentEventName]);

	const startSearch = useDebouncedCallback((name: string) => {
		if (sseChannel.current) {
			sseChannel.current.close();
			sseChannel.current = null;
			setEvents([]);
		}

		const trimmedName = name.trim();
		if (!trimmedName) {
			setEvents([]);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		sseChannel.current = api.sse.getEventSource({
			type: 'event',
			queryParams: {
				filters: ['name'],
				'name-values': [trimmedName],
				startTimestamp: moment.utc().valueOf(),
				searchDirection: 'previous',
				resultCountLimit: 10,
			},
		});
		const fetched: EventTreeNode[] = [];

		sseChannel.current.addEventListener('event', (ev: Event) => {
			if (ev instanceof MessageEvent) {
				const event: EventTreeNode = JSON.parse(ev.data);
				fetched.push(event);
			}
		});

		sseChannel.current.addEventListener('close', () => {
			if (sseChannel.current) {
				sseChannel.current.close();
				sseChannel.current = null;
			}
			setEvents(fetched);
			setIsLoading(false);
		});

		sseChannel.current.addEventListener('error', () => {
			if (sseChannel.current) {
				sseChannel.current.close();
				sseChannel.current = null;
			}
			setEvents([]);
			setIsLoading(false);
		});
	}, 400);

	return useMemo(
		() => ({
			data: events,
			isLoading,
		}),
		[events, isLoading],
	);
};
