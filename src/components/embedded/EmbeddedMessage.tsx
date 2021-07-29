import React, { useEffect, useState } from 'react';
import api from '../../api';
import { EventMessage, MessageViewType } from '../../models/EventMessage';
import { MinimalMessageCard } from '../message/message-card/MessageCard';
import SplashScreen from '../SplashScreen';

function EmbeddedMessage({ messageId }: { messageId: string }) {
	const [message, setMessage] = useState<EventMessage | null>();
	const [viewType, setViewType] = useState(MessageViewType.JSON);

	useEffect(() => {
		getMessage();
	}, []);

	async function getMessage() {
		const res = await api.messages.getMessage(messageId);
		setMessage(res);
		setViewType(message?.viewType ? message.viewType : MessageViewType.JSON);
	}

	if (message) {
		return (
			<MinimalMessageCard
				isEmbedded
				message={message}
				setViewType={setViewType}
				viewType={viewType}
			/>
		);
	}

	return <SplashScreen />;
}

export default EmbeddedMessage;
