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

import { createStyleSelector } from 'helpers/styleCreators';
import { formatTime } from 'helpers/date';
import { getEventStatus } from 'helpers/event';
import { EventAction } from 'models/EventAction';
import { StatusIcon } from 'components/icons/StatusIcon';
import { BookmarkIcon } from 'components/icons/BookmarkIcon';
import { Chip } from 'components/Chip';
import { copyTextToClipboard } from 'helpers/copyHandler';
import { showNotification } from 'helpers/showNotification';
import EventBodyCard from './EventBodyCard';

interface Props {
	event: EventAction;
	isBookmarked?: boolean;
	onBookmarkClick?: (node: EventAction) => void;
	isUnknown?: boolean;
}

function EventCard(props: Props) {
	const { isBookmarked = false, onBookmarkClick, event, isUnknown = false } = props;

	const onToggleBookmark = () => {
		if (onBookmarkClick) {
			onBookmarkClick(event);
		}
	};

	const copyId = () => {
		copyTextToClipboard(eventId);
		showNotification('Copied to clipboard');
	};

	const { startTimestamp, endTimestamp, eventType, eventName, body, eventId } = event;

	const status = isUnknown ? 'unknown' : getEventStatus(event);

	const cardClassName = createStyleSelector('event-card__header', status);

	const endTs = endTimestamp && endTimestamp !== startTimestamp ? endTimestamp : null;

	return (
		<div className='event-card'>
			<div className={cardClassName}>
				<div>
					<Chip className='event-card__bookmark' onClick={onToggleBookmark}>
						<BookmarkIcon isPinned={isBookmarked} />
					</Chip>
					<div className='event-card__title' title={eventName}>
						{eventName}
					</div>
					{eventType && <Chip>{eventType}</Chip>}
					<div className='event-card__status-icon'>
						<StatusIcon status={status} />
					</div>
				</div>
				<div>
					<Chip className='event-card__id' onClick={copyId} title={eventId}>
						{eventId}
					</Chip>
					<div className='event-card__timestamp'>
						<Chip>{formatTime(startTimestamp)}</Chip>
						{endTs && <Chip>{formatTime(endTs)}</Chip>}
					</div>
				</div>
			</div>
			<EventBodyCard body={body} event={event} />
		</div>
	);
}

export default EventCard;
