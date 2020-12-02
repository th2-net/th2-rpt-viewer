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
import { useWorkspaceEventStore } from './useEventWindowStore';
import { EventAction, EventTreeNode } from '../models/EventAction';
import { usePrevious } from './usePrevious';

export function useCachedEvent(node: EventTreeNode, isVisible = true): EventAction | undefined {
	const eventWindowStore = useWorkspaceEventStore();
	const [event, setEvent] = React.useState(eventWindowStore.eventsCache.get(node.eventId));
	const previousNode = usePrevious(node);

	React.useEffect(() => {
		const abortController = new AbortController();

		if (isVisible) {
			if (!event || !node.childList) {
				eventWindowStore
					.fetchEvent(node, abortController.signal)
					.then(setEvent)
					.catch(err => {
						if (err.name !== 'AbortError') {
							console.error(`Error while loading event ${node.eventId}`);
						}
					});
			} else if (node !== previousNode) {
				if (eventWindowStore.eventsCache.has(node.eventId)) {
					setEvent(eventWindowStore.eventsCache.get(node.eventId));
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
