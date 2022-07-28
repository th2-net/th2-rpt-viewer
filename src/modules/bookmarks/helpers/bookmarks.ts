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

import { isEvent } from 'helpers/event';
import { isEventMessage } from 'helpers/message';
import { Bookmark, EventBookmark, MessageBookmark } from '../models/Bookmarks';

export function isBookmark(item: unknown): item is Bookmark {
	return (item as Bookmark).id !== undefined && (item as Bookmark).item !== undefined;
}

export function isEventBookmark(bookmark: unknown): bookmark is EventBookmark {
	return isBookmark(bookmark) && isEvent(bookmark.item);
}

export function isMessageBookmark(bookmark: unknown): bookmark is MessageBookmark {
	return isBookmark(bookmark) && isEventMessage(bookmark.item);
}
