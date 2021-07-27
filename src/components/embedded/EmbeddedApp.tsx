import { observer } from 'mobx-react-lite';
import React from 'react';
import EmbeddedEvent from './EmbeddedEvent';
import EmbeddedMessage from './EmbeddedMessage';

function EmbeddedApp() {
	if (window.location.search.split('&').length > 2) {
		throw new Error('Only one query parameter expected.');
	}
	const searchParams = new URLSearchParams(window.location.search);
	const eventId = searchParams.get('eventId');
	const messageId = searchParams.get('messageId');
	window.history.replaceState({}, '', window.location.pathname);

	if (eventId) {
		return <EmbeddedEvent eventId={eventId} />;
	}
	if (messageId) {
		return <EmbeddedMessage messageId={messageId} />;
	}
	return <p>Message or event ID not found</p>;
}

export default observer(EmbeddedApp);
