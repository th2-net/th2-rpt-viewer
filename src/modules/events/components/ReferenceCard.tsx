/** *****************************************************************************
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

import { useReducer } from 'react';
import { EventAction } from 'models/EventAction';
import { createBemBlock } from 'helpers/styleCreators';
import { EventBodyPayload } from '../models/EventBodyPayload';
import EventBodyCard from './event-card/EventBodyCard';

interface Props {
	eventId: string;
	body: EventBodyPayload[];
	referencedEvent: EventAction | null;
	referenceHistory?: Array<string>;
}

export const ReferenceCard = (props: Props) => {
	const { eventId, body, referencedEvent, referenceHistory = [] } = props;

	const [isOpen, toggleIsOpen] = useReducer(o => !o, false);

	const referenceName = `Referenced from ${eventId}`;

	return (
		<div className='event-reference-card'>
			<div className='event-reference-card__header'>
				<div className='event-reference-card__title' title={referenceName}>
					{referenceName}
				</div>
				<div
					className={createBemBlock('expand-icon', isOpen ? 'expanded' : 'hidden')}
					onClick={toggleIsOpen}
				/>
			</div>
			<div className='event-reference'>
				{isOpen &&
					(referencedEvent ? (
						referenceHistory.includes(eventId) ? (
							<div className='event-reference__error'>
								Event {eventId} already rendered in reference chain.
							</div>
						) : (
							referencedEvent &&
							(body.length > 0 ? (
								body.map((bodyPayloadItem, index) => (
									<EventBodyCard
										key={`body-${eventId}-${index}`}
										body={bodyPayloadItem}
										parentEvent={referencedEvent}
										referenceHistory={[...referenceHistory, eventId]}
									/>
								))
							) : (
								<div className='event-reference__error'> Event {eventId} has empty body</div>
							))
						)
					) : (
						<div className='event-reference__error'>Event {eventId} does not exist</div>
					))}
			</div>
		</div>
	);
};
