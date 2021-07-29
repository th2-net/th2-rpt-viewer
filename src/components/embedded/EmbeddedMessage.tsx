import React, { useEffect, useState } from 'react';
import api from '../../api';
import { EventMessage, MessageViewType } from '../../models/EventMessage';
import { MinimalMessageCard } from '../message/message-card/MessageCard';

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
		console.log(res);
	}

	if (message) {
		return <MinimalMessageCard message={message} setViewType={setViewType} viewType={viewType} />;
	}

	return <p>loading</p>;
}

export default EmbeddedMessage;
