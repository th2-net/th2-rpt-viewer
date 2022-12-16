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

import { useEffect, useState } from 'react';
import EventBodyCard from 'modules/events/components/event-card/EventBodyCard';
import fetch from 'helpers/fetchRetry';
import { EventCardHeaderBase } from '../components/event-card/EventCardHeader';
import { EventAction } from '../../../models/EventAction';
import SplashScreen from '../../../components/SplashScreen';
import { toEventTreeNode } from '../helpers/event';
import 'styles/events.scss';

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
			<div className='event-card'>
				<EventCardHeaderBase event={toEventTreeNode(event)} />
				<EventBodyCard key={eventId} event={event} />
			</div>
		);
	}
	return <SplashScreen />;
}

export default EmbeddedEvent;
