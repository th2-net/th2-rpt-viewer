import React, { useEffect, useState } from 'react';
import { EventMessage, MessageViewType } from '../../models/EventMessage';
import { MessageCardBase } from '../message/message-card/MessageCard';
import SplashScreen from '../SplashScreen';

function EmbeddedMessage({ messageId }: { messageId: string }) {
	const [message, setMessage] = useState<EventMessage | null>();
	const [viewType, setViewType] = useState(MessageViewType.JSON);
	const [errorStatus, setErrorStatus] = useState<string | null>(null);

	useEffect(() => {
		getMessage();
	}, []);

	async function getMessage() {
		const res = await fetch(`backend/message/${messageId}`);
		if (res.ok) {
			setMessage(await res.json());
		} else {
			setErrorStatus(`${res.status} ${res.statusText}`);
		}
	}

	if (errorStatus) {
		throw new Error(errorStatus);
	}

	if (message) {
		return (
			<MessageCardBase isEmbedded message={message} setViewType={setViewType} viewType={viewType} />
		);
	}

	return <SplashScreen />;
}

export default EmbeddedMessage;
