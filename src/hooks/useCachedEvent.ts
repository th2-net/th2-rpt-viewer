/** *****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import { EventIdNode } from '../stores/EventWindowStore';
import useAsyncEffect from './useAsyncEffect';

export default function useCachedEvent(node: EventIdNode, isVisible = true): EventAction | undefined {
	const eventWindowStore = useEventWindowStore();
	const [event, setEvent] = React.useState(eventWindowStore.eventsCache.get(node.id));

	React.useEffect(() => {
		const abortController = new AbortController();

		if (isVisible) {
			if (!event) {
				eventWindowStore.fetchEvent(node.id, abortController.signal)
					.then(setEvent);
			} else if (event.eventId !== node.id) {
				// handle event node change
				if (eventWindowStore.eventsCache.has(node.id)) {
					setEvent(eventWindowStore.eventsCache.get(node.id)!);
				} else {
					eventWindowStore.fetchEvent(node.id, abortController.signal)
						.then(setEvent);
				}
			}
		}

		return () => {
			abortController.abort();
		};
	}, [node, isVisible]);

	return event;
}

export function useEventSubNodes(node: EventIdNode, isVisible = true): EventIdNode[] | null {
	const eventWindowStore = useEventWindowStore();
	const [subNodes, setSubNodes] = React.useState(node.children);

	useAsyncEffect(async () => {
		if (!subNodes && isVisible) {
			setSubNodes(await eventWindowStore.fetchEventChildren(node));
		}
	}, [isVisible]);

	// handle node change
	useAsyncEffect(async () => {
		// ignore first render
		if (!subNodes) {
			return;
		}

		setSubNodes(node.children);

		if (!node.children) {
			setSubNodes(await eventWindowStore.fetchEventChildren(node));
		}
	}, [node]);

	return subNodes;
}
