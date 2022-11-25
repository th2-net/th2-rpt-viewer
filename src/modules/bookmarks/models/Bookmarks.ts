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

import { EventTreeNode } from '../../../models/EventAction';
import { EventMessage } from '../../../models/EventMessage';

export interface Bookmark<T extends EventTreeNode | EventMessage = EventTreeNode | EventMessage> {
	timestamp: number;
	id: string;
	item: T;
}

export type BookmarkType = 'event' | 'message';

export type EventBookmark = Bookmark<EventTreeNode>;
export type MessageBookmark = Bookmark<EventMessage>;