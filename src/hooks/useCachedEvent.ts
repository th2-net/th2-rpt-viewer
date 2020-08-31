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

import * as React from 'react';
import { useEventWindowStore } from './useEventWindowStore';
import { EventAction } from '../models/EventAction';
import { EventIdNode } from '../stores/EventsStore';

export default function useCachedEvent(node: EventIdNode, isVisible = true): EventAction | undefined {
	const eventWindowStore = useEventWindowStore();
	const [event, setEvent] = React.useState(eventWindowStore.eventsCache.get(node.id));

	React.useEffect(() => {
		const abortController = new AbortController();

		if (isVisible) {
			if (!event || !node.children) {
				eventWindowStore
					.fetchEvent(node, abortController.signal)
					.then(setEvent)
					.catch(err => {
						if (err.name !== 'AbortError') {
							console.error(`Error while loading event ${node.id}`);
						}
					});
			} else if (`${event.batchId}:${event.eventId}` !== node.id) {
				// handle event node change
				if (eventWindowStore.eventsCache.has(node.id)) {
					setEvent(eventWindowStore.eventsCache.get(node.id));
				} else {
					eventWindowStore
						.fetchEvent(node, abortController.signal)
						.then(setEvent)
						.catch(err => {
							if (err.name !== 'AbortError') {
								console.error(`Error while loading event ${event.eventId}`);
							}
						});
				}
			}
		}

		return () => {
			abortController.abort();
		};
	}, [node, isVisible]);

	return event;
}
