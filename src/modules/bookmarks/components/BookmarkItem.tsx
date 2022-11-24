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

// eslint-disable-next-line max-len
import { MessageCardHeader } from 'modules/messages/components/message-card/header/MessageCardHeader';
import EventCardHeader from 'modules/events/components/event-card/EventCardHeader';
import { EventBookmark, MessageBookmark } from '../models/Bookmarks';

interface MessageBookmarkComponentProps {
	bookmark: MessageBookmark;
	onClick: (message: MessageBookmark) => void;
}

export const MessageBookmarkComponent = (props: MessageBookmarkComponentProps) => (
	<MessageCardHeader
		message={props.bookmark.item}
		isBookmarked={true}
		onClick={() => props.onClick(props.bookmark)}
	/>
);

interface EventBookmarkComponentProps {
	bookmark: EventBookmark;
	onClick: (event: EventBookmark) => void;
}

export const EventBookmarkComponent = (props: EventBookmarkComponentProps) => (
	<EventCardHeader event={props.bookmark.item} onSelect={() => props.onClick(props.bookmark)} />
);
