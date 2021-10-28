import React from 'react';
import { observer } from 'mobx-react-lite';
import { useMessagesWorkspaceStore, useMessagesDataStore } from '../../hooks';
import { EventMessage } from '../../models/EventMessage';

interface Props {
	attachedMessages: EventMessage[];
}

const MessageAttachedSelection = (props: Props) => {
	const { attachedMessages } = props;

	const messagesStore = useMessagesWorkspaceStore();
	const messagesDataStore = useMessagesDataStore();

	const [messageIndex, setMessageIndex] = React.useState<number>(0);

	React.useEffect(() => {
		if (attachedMessages.length === 0) setMessageIndex(0);
	});

	const onPrevious = () => {
		if (messageIndex !== 0 && messagesDataStore.messages.includes(attachedMessages[messageIndex])) {
			messagesStore.scrollToMessage(attachedMessages[messageIndex].messageId);
			setMessageIndex(messageIndex - 1);
		} else if (messageIndex !== 0) {
			messagesStore.onMessageSelect(attachedMessages[messageIndex]);
			setMessageIndex(messageIndex - 1);
		}
	};

	const onNext = () => {
		if (
			messageIndex !== attachedMessages.length - 1 &&
			messagesDataStore.messages.includes(attachedMessages[messageIndex])
		) {
			messagesStore.scrollToMessage(attachedMessages[messageIndex].messageId);
			setMessageIndex(messageIndex + 1);
		} else if (messageIndex !== attachedMessages.length - 1) {
			messagesStore.onMessageSelect(attachedMessages[messageIndex]);
			setMessageIndex(messageIndex + 1);
		}
	};

	if (attachedMessages.length === 0) return null;

	return (
		<div className='messages-window-header__attached-messages'>
			{attachedMessages.length > 1 ? (
				<div className='messages-window-header__attached-messages-button' onClick={onPrevious}>
					&#8249;
				</div>
			) : null}
			<span className='messages-window-header__attached-messages-text'>
				{messageIndex + 1} of {attachedMessages.length}
			</span>
			{attachedMessages.length > 1 ? (
				<div className='messages-window-header__attached-messages-button' onClick={onNext}>
					&#8250;
				</div>
			) : null}
		</div>
	);
};

export default observer(MessageAttachedSelection);
