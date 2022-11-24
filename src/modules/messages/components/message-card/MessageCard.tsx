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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { EventMessage, MessageViewType } from 'models/EventMessage';
import { createBemElement } from 'helpers/styleCreators';
import { isEventMessage } from 'helpers/message';
import CardDisplayType from 'models/util/CardDisplayType';
import { MessageCardViewTypeRendererProps } from './MessageBody';
import { MessageCardHeader } from './header/MessageCardHeader';
import { ParsedMessageComponent } from './ParsedMessage';
import MessageCardWarning from '../MessageCardWarning';
import 'styles/messages.scss';

interface MessageCardProps {
	message: EventMessage;
	displayType: CardDisplayType;
	addMessageToExport?: (msg: EventMessage) => void;
	isExport?: boolean;
	isExported?: boolean;
	isAttached?: boolean;
	isHighlighted?: boolean;
	isBookmarked?: boolean;
	toggleMessagePin?: () => void;
	isEmbedded?: boolean;
	sortOrderItems?: string[];
	isExpanded?: boolean;
	setIsExpanded?: (isExpanded: boolean) => void;
	viewTypesMap: Map<string, MessageViewType>;
	setViewType: (id: string, vt: MessageViewType) => void;
}

const MessageCard = (props: MessageCardProps) => {
	const {
		message,
		isExpanded: isExpandedProp,
		setIsExpanded: setIsExpandedProp,
		isAttached,
		isBookmarked,
		displayType,
		sortOrderItems = [],
		viewTypesMap,
		setViewType,
	} = props;

	const [expanded, setIsExpanded] = React.useState(isExpandedProp || false);

	const isExpanded = isExpandedProp === undefined ? expanded : isExpandedProp;
	const updateIsExpanded = setIsExpandedProp || setIsExpanded;

	const { id, rawMessageBase64 } = message;

	const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
		messageId: id,
		rawMessageBase64,
		isSelected: isAttached || false,
		sortOrderItems,
	};

	const indicatorClass = createBemElement(
		'message-card',
		'status',
		isBookmarked ? 'bookmarked' : null,
		isAttached ? 'attached' : null,
	);

	const messages = React.useMemo(() => {
		const parsedMessages = message.parsedMessages || [];

		return [...parsedMessages, message];
	}, [message]);

	return (
		<div className='message-card'>
			<div className='message-card__body'>
				<div className={indicatorClass} />
				<div className='message-card__messages'>
					<MessageCardHeader
						{...props}
						viewType={viewTypesMap.get(messages[0].id)}
						setViewType={setViewType}
						setIsExpanded={updateIsExpanded}
					/>
					{messages.slice(0, isExpanded ? undefined : 1).map((msg, index) => (
						<ParsedMessageComponent
							key={msg.id}
							parsedMessage={isEventMessage(msg) ? undefined : msg}
							displayType={displayType}
							viewType={viewTypesMap.get(msg.id)}
							setViewType={setViewType}
							messageViewTypeRendererProps={messageViewTypeRendererProps}
							displayHeader={index > 0}
							message={message}
						/>
					))}
				</div>
			</div>
			{!message.parsedMessages && <MessageCardWarning />}
		</div>
	);
};

MessageCard.displayName = 'MessageCard';

export default observer(MessageCard);
