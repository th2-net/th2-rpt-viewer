import { EventBookmark, MessageBookmark } from '../components/bookmarks/BookmarksPanel';
import { MessageDisplayRule } from './EventMessage';

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

export interface User {
	id: string;
	name: string;
	timestamp: number;
}

export interface UserPrefs {
	messageDisplayRules: {
		rules: MessageDisplayRule[];
		rootRule: MessageDisplayRule;
	};
	messageBodySortOrder: string[];
	pinned: {
		events: EventBookmark[];
		messages: MessageBookmark[];
	};
}

export interface UserFeedback {
	user: string;
	title: string;
	descr: string;
	image?: string;
	errors: Partial<ErrorEvent>[];
	responses: Partial<Response>[];
}
