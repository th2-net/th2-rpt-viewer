import * as React from 'react';
import EventBodyCard from './EventBodyCard';
import { EventAction } from '../../models/EventAction';
import { EventBodyPayload } from '../../models/EventActionPayload';
import { createBemBlock } from '../../helpers/styleCreators';

interface Props {
	eventId: string;
	body: EventBodyPayload[] | null;
	parentEvent: EventAction | null;
	referenceHistory?: Array<string>;
}

export const ReferenceCard = ({ eventId, body, parentEvent, referenceHistory = [] }: Props) => {
	const [isOpen, setIsOpen] = React.useState(true);
	const referenceName = `Referenced from ${eventId}`;

	return (
		<div className='event-reference-card'>
			<div className='event-reference-card__header'>
				<div className='event-reference-card__title' title={referenceName}>
					{referenceName}
				</div>
				<div
					className={createBemBlock('expand-icon', isOpen ? 'expanded' : 'hidden')}
					onClick={() => setIsOpen(!isOpen)}
				/>
			</div>
			<div className='event-reference'>
				{body ? (
					isOpen &&
					(referenceHistory.includes(eventId) ? (
						<div className='event-reference__error'>
							Event {eventId} already rendered in reference chain.
						</div>
					) : (
						parentEvent &&
						(body.length > 0 ? (
							body.map((bodyPayloadItem, index) => (
								<EventBodyCard
									key={`body-${eventId}-${index}`}
									body={bodyPayloadItem}
									parentEvent={parentEvent}
									referenceHistory={[...referenceHistory, eventId]}
								/>
							))
						) : (
							<div className='event-reference__error'> Event {eventId} have empty body</div>
						))
					))
				) : (
					<div className='event-reference__error'>Event {eventId} does not exist</div>
				)}
			</div>
		</div>
	);
};
