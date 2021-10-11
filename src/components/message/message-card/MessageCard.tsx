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

import {
	useMessageDisplayRulesStore,
	useMessagesWorkspaceStore,
	useMessagesDataStore,
	useSelectedStore,
	useMessageBodySortStore,
} from '../../../hooks';
import { keyForMessage } from '../../../helpers/keys';
import StateSaver from '../../util/StateSaver';
import { EventMessage, MessageViewType } from '../../../models/EventMessage';
import { matchWildcardRule } from '../../../helpers/regexp';
import { MessageCardBase } from './MessageCardBase';
import '../../../styles/messages.scss';
import { MessageBodyPayload } from '../../../models/MessageBody';

export interface OwnProps {
	message: EventMessage;
	isHighlighted?: boolean;
}

export interface RecoveredProps {
	message: EventMessage;
	isEmbedded?: boolean;
	isAttached?: boolean;
	isBookmarked?: boolean;
	isSoftFiltered?: boolean;
	isHighlighted?: boolean;
	isExported?: boolean;
	isExport?: boolean;
	hoverMessage?: () => void;
	unhoverMessage?: () => void;
	toogleMessagePin?: () => void;
	sortOrderItems?: string[];
	addMessageToExport?: () => void;
}

const MessageCard = observer(({ message, isHighlighted }: OwnProps) => {
	const { messageId } = message;

	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();
	const selectedStore = useSelectedStore();
	const { sortOrderItems } = useMessageBodySortStore();

	const hoverTimeout = React.useRef<NodeJS.Timeout>();

	const isBookmarked =
		selectedStore.bookmarkedMessages.findIndex(
			bookmarkedMessage => bookmarkedMessage.id === messageId,
		) !== -1;

	const isSoftFiltered = messagesDataStore.isSoftFiltered.get(messageId);

	const isAttached = !!messagesStore.attachedMessages.find(
		attMsg => attMsg.messageId === message.messageId,
	);
	React.useEffect(() => {
		const abortController = new AbortController();

		if (
			messagesStore.filterStore.isSoftFilter &&
			messagesDataStore.isSoftFiltered.get(messageId) === undefined
		) {
			messagesDataStore.matchMessage(messageId, abortController.signal);
		}

		return () => {
			abortController.abort();
		};
	}, []);

	const hoverMessage = () => {
		hoverTimeout.current = setTimeout(() => {
			messagesStore.setHoveredMessage(message);
		}, 600);
	};

	const unhoverMessage = () => {
		if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
		messagesStore.setHoveredMessage(null);
	};

	function toogleMessagePin() {
		selectedStore.toggleMessagePin(message);
	}

	const isExported = messagesStore.exportStore.isExported(message);

	return (
		<RecoverableMessageCard
			message={message}
			isHighlighted={isHighlighted}
			isAttached={isAttached}
			isBookmarked={isBookmarked}
			isSoftFiltered={isSoftFiltered}
			hoverMessage={hoverMessage}
			unhoverMessage={unhoverMessage}
			toogleMessagePin={toogleMessagePin}
			isExported={isExported}
			isExport={messagesStore.exportStore.isExport}
			sortOrderItems={sortOrderItems}
			addMessageToExport={() => messagesStore.exportStore.addMessageToExport(message)}
		/>
	);
});

export default MessageCard;

export const RecoverableMessageCard = React.memo((props: RecoveredProps) => {
	const rulesStore = useMessageDisplayRulesStore();

	return (
		<div>
			{props.message.body?.map((item: MessageBodyPayload) => (
				<StateSaver
					stateKey={keyForMessage(`${props.message.messageId}-${item.subsequenceId[0]}`)}
					key={`${props.message.messageId}-${item.subsequenceId[0]}`}
					getDefaultState={() => {
						const rootRule = rulesStore.rootDisplayRule;
						const declaredRule = rulesStore.messageDisplayRules.find(rule => {
							if (rule.session.length > 1 && rule.session.includes('*')) {
								return matchWildcardRule(props.message.sessionId, rule.session);
							}
							return props.message.sessionId.includes(rule.session);
						});
						if (!props.message.body) {
							return declaredRule
								? getRawViewType(declaredRule.viewType)
								: rootRule
								? getRawViewType(rootRule.viewType)
								: MessageViewType.ASCII;
						}
						return declaredRule
							? declaredRule.viewType
							: rootRule
							? rootRule.viewType
							: MessageViewType.JSON;
					}}>
					{(state, saveState) => (
						<MessageCardBase
							{...props}
							bodyItem={item}
							// we should always show raw content if something found in it
							viewType={state}
							setViewType={saveState}
						/>
					)}
				</StateSaver>
			))}
		</div>
	);
});

RecoverableMessageCard.displayName = 'RecoverableMessageCard';

function isRawViewType(viewType: MessageViewType) {
	return viewType === MessageViewType.ASCII || viewType === MessageViewType.BINARY;
}

function getRawViewType(viewType: MessageViewType) {
	return isRawViewType(viewType) ? viewType : MessageViewType.ASCII;
}
