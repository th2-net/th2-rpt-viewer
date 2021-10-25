import React from 'react';
import { observer } from 'mobx-react-lite';
import { useMessagesWorkspaceStore } from '../../hooks';
import { EventMessage } from '../../models/EventMessage';

interface Props {
	attachedMessages: EventMessage[];
}

const MessageAttachedSelection = (props: Props) => {
	const { attachedMessages } = props;

	const messagesStore = useMessagesWorkspaceStore();

	const [isAttachedMessages, setIsAttachedMessages] = React.useState<boolean>(false);
	const [messageIndex, setMessageIndex] = React.useState<number>(0);

	React.useEffect(() => {
		if (attachedMessages.length !== 0) {
			setIsAttachedMessages(true);
			messagesStore.onMessageSelect(attachedMessages[messageIndex]);
		} else {
			setIsAttachedMessages(false);
			setMessageIndex(0);
		}
	});

	const onPrevious = () => {
		if (messageIndex !== 0) {
			setMessageIndex(messageIndex - 1);
			messagesStore.onMessageSelect(attachedMessages[messageIndex]);
		}
	};

	const onNext = () => {
		if (messageIndex !== attachedMessages.length - 1) {
			setMessageIndex(messageIndex + 1);
			messagesStore.onMessageSelect(attachedMessages[messageIndex]);
		}
	};

	return (
		<>
			{isAttachedMessages ? (
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
			) : null}
		</>
	);
};

export default observer(MessageAttachedSelection);
