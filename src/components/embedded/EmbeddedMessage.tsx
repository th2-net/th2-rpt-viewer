import React, { useEffect, useState } from 'react';
import api from '../../api';
import { EventMessage } from '../../models/EventMessage';

function EmbeddedMessage({ messageId }: { messageId: string }) {
	const [message, setMessage] = useState<EventMessage | null>(null);

	useEffect(() => {
		getMessage();
	}, []);

	async function getMessage() {
		const res = await api.messages.getMessage(messageId);
		setMessage(res);
		console.log(message);
	}

	return <p>{messageId}</p>;
}

export default EmbeddedMessage;
