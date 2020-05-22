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

import { EventAction } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';

export default interface ApiSchema {
	events: EventApiSchema;
	messages: MessageApiSchema;
}

export interface EventApiSchema {
    getAll: () => Promise<EventAction[]>;
    getEvent: (id: string, abortSignal?: AbortSignal) => Promise<EventAction>;
    getRange: (start: number, end: number) => Promise<EventAction[]>;
    getSubNodes: (id: string, abortSignal?: AbortSignal) => Promise<EventAction[]>;
    getSubNodesIds: (id: string) => Promise<string[]>;
}

export interface MessageApiSchema {
	getAll: () => Promise<number[]>;
	getMessagesIds: (timestampFrom: number, timestampTo: number) => Promise<string[]>;
	getMessages: (timestampFrom: number, timestampTo: number) => Promise<EventMessage[]>;
	getMessage: (id: string) => Promise<EventMessage | null>;
}
