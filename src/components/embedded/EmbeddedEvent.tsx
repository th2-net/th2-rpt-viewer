/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ***************************************************************************** */

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
			<div className='embedded-wrapper'>
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
			</div>
		);
	}
	return <SplashScreen />;
}

export default EmbeddedEvent;
