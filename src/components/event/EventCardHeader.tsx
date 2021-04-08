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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { formatTime, getElapsedTime, timestampToNumber } from '../../helpers/date';
import { createBemBlock } from '../../helpers/styleCreators';
import { EventTreeNode } from '../../models/EventAction';
import { getEventStatus } from '../../helpers/event';
import CardDisplayType from '../../util/CardDisplayType';
import { Chip } from '../Chip';
import SearchableContent from '../search/SearchableContent';
import { useSelectedStore, useWorkspaceEventStore } from '../../hooks';

interface Props {
	displayType?: CardDisplayType;
	event: EventTreeNode;
	onSelect?: () => void;
	isSelected?: boolean;
	isActive?: boolean;
	childrenCount?: number;
	isFlatView?: boolean;
	parentsCount?: number;
	rootStyle?: React.CSSProperties;
	disabled?: boolean;
}

function EventCardHeader({
	displayType = CardDisplayType.MINIMAL,
	event,
	onSelect,
	isSelected = false,
	isActive = false,
	childrenCount,
	isFlatView = false,
	parentsCount = 0,
	rootStyle = {},
	disabled = false,
}: Props) {
	const { eventId, eventName, eventType, startTimestamp, endTimestamp } = event;

	const selectedStore = useSelectedStore();
	const eventStore = useWorkspaceEventStore();

	const hoverTimeout = React.useRef<NodeJS.Timeout>();

	const status = getEventStatus(event);
	const startTimestampValue = timestampToNumber(startTimestamp);

	const elapsedTime =
		endTimestamp && startTimestamp ? getElapsedTime(startTimestamp, endTimestamp) : null;

	const isPinned = selectedStore.pinnedEvents.findIndex(e => e.eventId === event.eventId) !== -1;

	const rootClassName = createBemBlock(
		'event-header-card',
		status,
		displayType,
		isSelected ? 'selected' : null,
		isActive ? 'active' : null,
		onSelect ? 'clickable' : null,
		disabled ? 'disabled' : null,
	);

	const iconClassName = createBemBlock(
		'event-status-icon',
		status,
		isSelected ? 'selected' : null,
		isActive ? 'active' : null,
	);

	const bookmarkClassName = createBemBlock('bookmark-button', isPinned ? 'pinned' : null);

	const onPinClicked = (e: React.MouseEvent) => {
		selectedStore.toggleEventPin(event);
		e.stopPropagation();
	};

	const isUnknown = event.isUnknown;

	const onMouseEnter = () => {
		if (!isUnknown) {
			hoverTimeout.current = setTimeout(() => {
				eventStore.setHoveredEvent(event);
			}, 150);
		}
	};

	const onMouseLeave = () => {
		if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
		eventStore.setHoveredEvent(null);
	};

	return (
		<div
			className={rootClassName}
			onClick={() => {
				if (!disabled && onSelect) {
					onSelect();
				}
			}}
			style={rootStyle}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}>
			<div className={iconClassName} />
			{displayType !== CardDisplayType.STATUS_ONLY ? (
				<div className='event-header-card__title' title={eventName}>
					<SearchableContent content={eventName} eventId={eventId} />
				</div>
			) : null}
			{displayType !== CardDisplayType.STATUS_ONLY && !isUnknown ? (
				<>
					{elapsedTime && <span className='event-header-card__elapsed-time'>{elapsedTime}</span>}
					<div className='event-header-card__time-label'>
						<span className='event-header-card__time-label-full'>
							{formatTime(startTimestampValue)}
						</span>
					</div>
					{eventType && <span className='event-header-card__event-type'>{eventType}</span>}
				</>
			) : null}
			{isFlatView && parentsCount > 0 ? <Chip text={parentsCount.toString()} /> : null}
			{displayType !== CardDisplayType.STATUS_ONLY &&
				childrenCount !== undefined &&
				childrenCount > 0 && (
					<Chip
						text={childrenCount
							.toString()
							.concat(eventStore.eventDataStore.hasUnloadedChildren.get(event.eventId) ? '+' : '')}
					/>
				)}
			{!isUnknown && <div className={bookmarkClassName} onClick={onPinClicked} />}
		</div>
	);
}

export default observer(EventCardHeader);
