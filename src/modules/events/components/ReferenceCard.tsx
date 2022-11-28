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

import clsx from 'clsx';
import React, { useReducer } from 'react';
import { IconButton } from 'components/buttons/IconButton';
import { ExpandIcon } from 'components/icons/ExpandIcon';
import { createStyleSelector } from 'helpers/styleCreators';
import { useEvent } from '../hooks/useEvent';
import EventBodyCard from './event-card/EventBodyCard';

interface Props {
	eventId: string;
	referenceHistory?: Array<string>;
}

export const ReferenceCard = (props: Props) => {
	const { eventId, referenceHistory = [] } = props;

	const { event: referencedEvent, isError, isLoading } = useEvent(eventId);

	let body = referencedEvent?.body || [];
	body = Array.isArray(body) ? body : [body];

	const [isExpanded, toggleIsOpen] = useReducer(o => !o, false);

	const referenceName = `Referenced from ${eventId}`;
	const isCycle = referencedEvent && referenceHistory.includes(eventId);

	const referenceCardClassName = createStyleSelector('reference-card', isExpanded ? 'open' : null);

	return (
		<div className='reference-card__outline' style={{ padding: referenceHistory.length * 4 }}>
			<div className={referenceCardClassName}>
				<div className='reference-card__header'>
					<div className='reference-card__title' title={referenceName}>
						{referenceName}
					</div>
					<IconButton className={clsx({ expanded: isExpanded })} onClick={toggleIsOpen}>
						<ExpandIcon />
					</IconButton>
				</div>
				{isLoading && <div>Loading event...</div>}
				{isExpanded && (
					<div className='reference-card__body'>
						{isCycle && (
							<ReferenceCardError>
								Event {eventId} already rendered in reference chain.
							</ReferenceCardError>
						)}
						{referencedEvent &&
							(body.length > 0 ? (
								<EventBodyCard
									event={referencedEvent}
									referenceHistory={[...referenceHistory, eventId]}
								/>
							) : (
								<ReferenceCardError> Event {eventId} has empty body</ReferenceCardError>
							))}
						{isError && <ReferenceCardError>Event {eventId} does not exist</ReferenceCardError>}
					</div>
				)}
			</div>
		</div>
	);
};

function ReferenceCardError(props: React.PropsWithChildren<{}>) {
	return <div className='reference-card__error'>{props.children}</div>;
}
