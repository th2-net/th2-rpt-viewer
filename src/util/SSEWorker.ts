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

import { createURLSearchParams } from '../helpers/url';

interface EventSourceListener {
	name: string;
	callback: (this: EventSource, ev: Event | MessageEvent) => any;
}

class SSEWorker {
	eventsChannel: EventSource | null = null;

	messagesChannel: EventSource | null = null;

	startEventsChannel(queryParams: Record<string, string | number | boolean | null | string[]>) {
		const params = createURLSearchParams(queryParams);
		this.eventsChannel = new EventSource(`backend/search/sse/events/?${params}`);
	}

	addListenersToEventChannel(...listeners: EventSourceListener[]) {
		listeners.forEach(listener => {
			this.eventsChannel?.addEventListener(listener.name, listener.callback);
		});
	}

	closeEventsChannel() {
		this.eventsChannel?.close();
		this.eventsChannel = null;
	}

	startMessagesChannel(queryParams: Record<string, string | number | boolean | null | string[]>) {
		const params = createURLSearchParams(queryParams);
		this.eventsChannel = new EventSource(`backend/search/sse/events/?${params}`);
	}

	addListenersToMessageChannel(...listeners: EventSourceListener[]) {
		listeners.forEach(listener => {
			this.messagesChannel?.addEventListener(listener.name, listener.callback);
		});
	}

	closeMessagesChannel() {
		this.messagesChannel?.close();
		this.messagesChannel = null;
	}
}

const sseWorker = new SSEWorker();

export default sseWorker;
