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
import { EventMessage, MessageViewTypeConfig } from 'models/EventMessage';
import { createBemElement } from 'helpers/styleCreators';
import CardDisplayType from 'models/util/CardDisplayType';
import { MessageCardViewTypeRendererProps } from './MessageCardViewTypeRenderer';
import { MessageCardToolsProps } from './MessageCardTools';
import { defineViewTypeConfig } from '../../helpers/message';
import { MessageCardHeader } from './header/MessageCardHeader';
import { ParsedMessageComponent, ParsedMessageProps } from './ParsedMessage';
import { MessageCardRaw } from './raw/MessageCardRaw';
import 'styles/messages.scss';

export interface MessageCardBaseProps {
	message: EventMessage;
	displayType: CardDisplayType;
	addMessageToExport?: (msg: EventMessage) => void;
	isExport?: boolean;
	isExported?: boolean;
	viewTypeConfig: MessageViewTypeConfig | Map<string, MessageViewTypeConfig>;
	rawViewTypeConfig?: MessageViewTypeConfig;
	isAttached?: boolean;
	isHighlighted?: boolean;
	isBookmarked?: boolean;
	toogleMessagePin?: () => void;
	isEmbedded?: boolean;
	sortOrderItems?: string[];
	applyFilterToBody?: boolean;
	isExpanded: boolean;
	isDisplayRuleRaw: boolean;
	isScreenshotMsg?: boolean;
}

const MessageCardBase = React.memo((props: MessageCardBaseProps) => {
	const {
		message,
		viewTypeConfig,
		rawViewTypeConfig,
		isDisplayRuleRaw,
		isExpanded,
		isAttached,
		isHighlighted,
		isBookmarked,
		toogleMessagePin,
		displayType,
		sortOrderItems,
		applyFilterToBody = false,
	} = props;
	const { id, rawMessageBase64 } = message;

	const messageViewTypeRendererProps: MessageCardViewTypeRendererProps = {
		messageId: id,
		rawContent: rawMessageBase64,
		isSelected: isAttached || false,
		sortOrderItems: sortOrderItems || [],
		applyFilterToBody,
	};

	const messageCardToolsConfig: MessageCardToolsProps = {
		message,
		isBookmarked,
		toggleMessagePin: toogleMessagePin,
	};

	const viewType = defineViewTypeConfig(
		viewTypeConfig,
		message.parsedMessages && !isDisplayRuleRaw ? message.parsedMessages[0].id : message.id,
	).viewType;

	const setViewType = defineViewTypeConfig(
		viewTypeConfig,
		message.parsedMessages && !isDisplayRuleRaw ? message.parsedMessages[0].id : message.id,
	).setViewType;

	const parsedMessageProps: ParsedMessageProps = {
		displayType,
		isHighlighted,
		messageCardToolsConfig,
		messageViewTypeRendererProps,
	};

	const indicatorClass = createBemElement(
		'messages-list',
		'item-indicator',
		isBookmarked ? 'bookmarked' : null,
		isAttached ? 'attached' : null,
	);

	return (
		<div className='messages-list__item-info'>
			<div className={indicatorClass} />
			<div className='message-card-wrapper'>
				<div className='message-card'>
					<MessageCardHeader
						{...props}
						viewType={viewType}
						setViewType={setViewType}
						messageCardToolsConfig={messageCardToolsConfig}
					/>
					{!isDisplayRuleRaw &&
						message.parsedMessages
							?.slice(0, isExpanded ? undefined : 1)
							.map((parsedMessage, index) => (
								<ParsedMessageComponent
									{...parsedMessageProps}
									key={parsedMessage.id}
									parsedMessage={parsedMessage}
									displayHeader={index > 0}
									viewType={defineViewTypeConfig(viewTypeConfig, parsedMessage.id).viewType}
									setViewType={defineViewTypeConfig(viewTypeConfig, parsedMessage.id).setViewType}
								/>
							))}
					{(!message.parsedMessages || isExpanded || isDisplayRuleRaw) && (
						<MessageCardRaw
							message={message}
							viewType={
								rawViewTypeConfig?.viewType ||
								defineViewTypeConfig(viewTypeConfig, message.id).viewType
							}
							setViewType={
								rawViewTypeConfig?.setViewType ||
								defineViewTypeConfig(viewTypeConfig, message.id).setViewType
							}
							displayType={displayType}
							isScreenshotMsg={false}
							isHighlighted={isHighlighted}
							isDisplayRuleRaw={isDisplayRuleRaw}
							messageCardToolsConfig={messageCardToolsConfig}
							messageViewTypeRendererProps={messageViewTypeRendererProps}
						/>
					)}
				</div>
			</div>
		</div>
	);
});

MessageCardBase.displayName = 'MessageCardBase';
export default MessageCardBase;
