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
		<div className='messages-list__attached-messages'>
			<button className='messages-list__attached-messages-btn' onClick={onPrevious}>
				<div className='messages-list__attached-messages-btn-previous' />
			</button>
			<span className='messages-list__attached-messages-text'>Show previous</span>

			<span className='messages-list__attached-messages-text-counter'>
				<span className='messages-list__attached-messages-text-counter-current'>
					{messageIndex + 1}{' '}
				</span>
				| {attachedMessages.length}
			</span>
			<span className='messages-list__attached-messages-text'>Show next</span>
			<button className='messages-list__attached-messages-btn' onClick={onNext}>
				<div className='messages-list__attached-messages-btn-next' />
			</button>
		</div>
	);
};

export default observer(MessageAttachedSelection);
