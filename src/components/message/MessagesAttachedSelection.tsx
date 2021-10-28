import React from 'react';
import { observer } from 'mobx-react-lite';
import { useMessagesWorkspaceStore } from '../../hooks';
import { EventMessage } from '../../models/EventMessage';

const MessageAttachedSelection = () => {
	const messagesStore = useMessagesWorkspaceStore();

	const { attachedMessages } = messagesStore;

	const [currentAttachedMessages, setCurrentAttachedMessages] = React.useState<EventMessage[]>([]);
	const [messageIndex, setMessageIndex] = React.useState<number>(0);

	React.useEffect(() => {
		if (attachedMessages !== currentAttachedMessages) {
			setCurrentAttachedMessages(attachedMessages);
			setMessageIndex(0);
		}
	}, [attachedMessages]);

	const onPrevious = () => {
		if (messageIndex !== 0) {
			messagesStore.selectAttachedMessage(attachedMessages[messageIndex]);
			setMessageIndex(messageIndex - 1);
		}
	};

	const onNext = () => {
		if (messageIndex !== attachedMessages.length - 1) {
			messagesStore.selectAttachedMessage(attachedMessages[messageIndex]);
			setMessageIndex(messageIndex + 1);
		}
	};

	if (attachedMessages.length === 0) return null;

	return (
		<div className='messages-window-header__attached-messages'>
			<div className='messages-window-header__attached-messages-button' onClick={onPrevious}>
				&#8249;
			</div>
			<span className='messages-window-header__attached-messages-text'>
				{messageIndex + 1} of {attachedMessages.length}
			</span>
			<div className='messages-window-header__attached-messages-button' onClick={onNext}>
				&#8250;
			</div>
		</div>
	);
};

export default observer(MessageAttachedSelection);
