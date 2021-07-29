import React, { useEffect, useState } from 'react';
import api from '../../api';
import { EventAction } from '../../models/EventAction';
import EventBodyCard from '../event/EventBodyCard';
import SplashScreen from '../SplashScreen';

function EmbeddedEvent({ eventId }: { eventId: string }) {
	const [event, setEvent] = useState<EventAction | null>(null);

	useEffect(() => {
		getMessage();
	}, []);

	async function getMessage() {
		const eventRes = await api.events.getEvent(eventId);
		setEvent(eventRes);
	}

	if (event) {
		return (
			<>
				{Array.isArray(event.body) ? (
					event.body.map((bodyPayloadItem, index) => (
						<EventBodyCard
							key={`body-${eventId}-${index}`}
							body={bodyPayloadItem}
							parentEvent={event}
						/>
					))
				) : (
					<EventBodyCard key={eventId} body={event.body} parentEvent={event} />
				)}
			</>
		);
	}

	return <SplashScreen />;
}

export default EmbeddedEvent;
