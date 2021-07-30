import React, { useEffect, useState } from 'react';
import { EventAction } from '../../models/EventAction';
import EventBodyCard from '../event/EventBodyCard';
import SplashScreen from '../SplashScreen';

function EmbeddedEvent({ eventId }: { eventId: string }) {
	const [event, setEvent] = useState<EventAction | null>(null);
	const [errorStatus, setErrorStatus] = useState<string | null>(null);

	useEffect(() => {
		getEvent();
	}, []);

	async function getEvent() {
		const res = await fetch(`backend/event/${eventId}`);
		if (res.ok) {
			setEvent(await res.json());
		} else {
			setErrorStatus(`${res.status} ${res.statusText}`);
		}
	}

	if (errorStatus) {
		throw new Error(errorStatus);
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
