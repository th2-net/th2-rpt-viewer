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

import { useState, useMemo } from 'react';
import clsx from 'clsx';
import { observer } from 'mobx-react-lite';
import { EventMessage, MessageViewType } from 'models/EventMessage';
import { isEventMessage } from 'helpers/message';
import CardDisplayType from 'models/util/CardDisplayType';
import { Paper } from 'components/Paper';
import MessageBodyComponent, { MessageCardViewTypeRendererProps } from './MessageBody';
import { MessageCardHeader } from './header/MessageCardHeader';
import { ParsedMessageComponent } from './ParsedMessage';
import 'styles/messages.scss';

interface MessageCardProps {
	message: EventMessage;
	displayType?: CardDisplayType;
	showCheckbox?: boolean;
	checked?: boolean;
	onSelect?: (msg: EventMessage) => void;
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
	onIdClick?: (msg: EventMessage) => void;
}

const MessageCard = (props: MessageCardProps) => {
	const {
		message,
		isExpanded: isExpandedProp,
		setIsExpanded: setIsExpandedProp,
		isAttached,
		isBookmarked,
		displayType = CardDisplayType.FULL,
		sortOrderItems = [],
		viewTypesMap,
		setViewType,
		onSelect,
	} = props;

	const [expanded, setIsExpanded] = useState(isExpandedProp || false);

	const isExpanded = isExpandedProp === undefined ? expanded : isExpandedProp;
	const updateIsExpanded = setIsExpandedProp || setIsExpanded;

	const { id, rawMessageBase64 } = message;

	const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
		messageId: id,
		rawMessageBase64,
		isSelected: isAttached || false,
		sortOrderItems,
	};

	const messages = useMemo(() => {
		const parsedMessages = message.parsedMessages || [];
		return [...parsedMessages, message];
	}, [message]);

	const titleMessage = messages[0];
	const restMessages = isExpanded ? messages.slice(1) : [];

	const onlyRawData = !message.parsedMessages;

	return (
		<div className='message-card'>
			<div className='message-card__messages'>
				<Paper className='message-card__title-message'>
					<div
						className={clsx('message-card__status', {
							bookmarked: isBookmarked,
							attached: isAttached,
						})}
					/>
					<div>
						<MessageCardHeader
							{...props}
							viewType={viewTypesMap.get(titleMessage.id)}
							setViewType={setViewType}
							setIsExpanded={updateIsExpanded}
							displayType={displayType}
							onSelect={onSelect}
						/>
						<MessageBodyComponent
							onlyRawData={onlyRawData}
							{...messageViewTypeRendererProps}
							{...props}
							displayType={displayType}
							messageBody={isEventMessage(titleMessage) ? undefined : titleMessage.message}
							viewType={viewTypesMap.get(titleMessage.id)}
						/>
					</div>
				</Paper>
				{restMessages.map(msg => (
					<ParsedMessageComponent
						onlyRawData={onlyRawData}
						key={msg.id}
						parsedMessage={isEventMessage(msg) ? undefined : msg}
						displayType={displayType}
						viewType={viewTypesMap.get(msg.id)}
						setViewType={setViewType}
						messageViewTypeRendererProps={messageViewTypeRendererProps}
						message={message}
					/>
				))}
			</div>
		</div>
	);
};

MessageCard.displayName = 'MessageCard';

export default observer(MessageCard);
