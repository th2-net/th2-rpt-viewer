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

import React from 'react';
import { useAsyncEffect } from './useAsyncEffect';
import { useEventWindowStore } from './useEventWindowStore';
import api from '../api/event';
import { EventAction, EventTreeNode } from '../models/EventAction';

export const useParentEvents = (
	eventIdNode: EventTreeNode,
	parentIdNodes: EventTreeNode[],
	initialSelectedNode: EventTreeNode | null,
) => {
	const eventWindowStore = useEventWindowStore();

	const [parentEvents, setParentEvents] = React.useState<Map<string, EventAction>>(new Map());
	const [selectedNode, setSelectedNode] = React.useState<null | EventTreeNode>(initialSelectedNode);
	const [selectedParentEvent, selectParentEvent] = React.useState<null | EventAction>(null);
	const abortController = React.useRef(new AbortController());

	useAsyncEffect(async () => {
		eventWindowStore.selectedParentNode = selectedNode;
		if (!selectedNode) {
			selectParentEvent(null);
			return;
		}
		const parentEvent = parentEvents.get(selectedNode.eventId);
		if (parentEvent) {
			selectParentEvent(parentEvent);
		} else {
			await fetchParentEvent(selectedNode.eventId, abortController.current.signal);
		}
	}, [selectedNode]);

	React.useEffect(() => {
		if (eventWindowStore.selectedParentNode !== selectedNode) {
			setSelectedNode(eventWindowStore.selectedParentNode);
		}
	}, [eventWindowStore.selectedParentNode]);

	const fetchParentEvent = async (parentId: string, abortSignal: AbortSignal) => {
		try {
			const parentEvent = await api.getEvent(parentId, abortSignal);
			setParentEvents(new Map(parentEvents.set(parentId, parentEvent)));
			selectParentEvent(parentEvent);
		} catch (error) {
			console.error(`Couldn't fetch parent event ${parentId}`);
		}
	};

	return {
		selectedParentEvent,
		setSelectedNode,
		parentEvents,
		selectedNode,
	};
};
