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

import { EventMessage } from 'models/EventMessage';
import { EventTreeNode } from 'models/EventAction';
// eslint-disable-next-line max-len
import { MessageCardHeader } from 'modules/messages/components/message-card/header/MessageCardHeader';
import EventCardHeader from 'modules/events/components/event-card/EventCardHeader';

interface MessageBookmarkComponentProps {
	message: EventMessage;
	onClick: (message: EventMessage) => void;
}

export const MessageSearchResult = (props: MessageBookmarkComponentProps) => (
	<MessageCardHeader
		message={props.message}
		isBookmarked={true}
		onClick={() => props.onClick(props.message)}
	/>
);

interface EventBookmarkComponentProps {
	event: EventTreeNode;
	onClick: (event: EventTreeNode) => void;
}

export const EventSearchResult = (props: EventBookmarkComponentProps) => (
	<EventCardHeader event={props.event} onSelect={() => props.onClick(props.event)} />
);
