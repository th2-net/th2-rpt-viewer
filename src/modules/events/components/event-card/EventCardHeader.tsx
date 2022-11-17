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

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { formatTime } from 'helpers/date';
import { createBemBlock } from 'helpers/styleCreators';
import { EventTreeNode } from 'models/EventAction';
import { useBookmarksStore, useWorkspaceStore } from 'hooks/index';
import { getEventStatus } from 'helpers/event';
import { Chip } from 'components/Chip';
import { getElapsedTime } from '../../helpers/date';
import SearchableContent from '../search/SearchableContent';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { Counter } from './Counter';
import CardDisplayType from '../../models/CardDisplayType';

interface EventCardHeaderBaseProps {
	displayType?: CardDisplayType;
	event: EventTreeNode;
	onSelect?: (eventNode: EventTreeNode) => void;
	onEventTypeSelect?: (eventType: string) => void;
	isSelected?: boolean;
	isActive?: boolean;
	childrenCount?: number;
	isFlatView?: boolean;
	parentsCount?: number;
	rootStyle?: React.CSSProperties;
	disabled?: boolean;
	isBookmarked?: boolean;
	toggleEventPin?: (event: EventTreeNode) => void;
	onFilterByParentEvent?: (event: EventTreeNode) => void;
	hasChildrenToLoad?: boolean;
}

function EventCardHeaderBase(props: EventCardHeaderBaseProps) {
	const {
		displayType = CardDisplayType.MINIMAL,
		event,
		onSelect,
		onEventTypeSelect,
		isSelected = false,
		isActive = false,
		isFlatView = false,
		childrenCount = 0,
		parentsCount = 0,
		disabled = false,
		isBookmarked = false,
		toggleEventPin,
		onFilterByParentEvent,
		hasChildrenToLoad = false,
	} = props;
	const { eventId, eventName, eventType, startTimestamp, endTimestamp } = event;

	const status = getEventStatus(event);

	const elapsedTime =
		endTimestamp && startTimestamp ? getElapsedTime(startTimestamp, endTimestamp) : null;

	const rootClassName = createBemBlock(
		'event-header-card',
		status,
		displayType,
		isSelected ? 'selected' : null,
		isActive ? 'active' : null,
		onSelect ? null : 'not-selectable',
		disabled ? 'disabled' : null,
	);

	const iconClassName = createBemBlock('event-status-icon', status);

	const bookmarkClassName = createBemBlock('bookmark-button', isBookmarked ? 'pinned' : null);

	function onPinClicked(e: React.MouseEvent) {
		e.stopPropagation();
		if (toggleEventPin) toggleEventPin(event);
	}

	function onFilterClick(e: React.MouseEvent) {
		e.stopPropagation();
		if (onFilterByParentEvent) onFilterByParentEvent(event);
	}

	function onRootClick() {
		if (!disabled && onSelect) {
			onSelect(event);
		}
	}

	function handleTypeClick(e: React.MouseEvent) {
		if (onEventTypeSelect) {
			e.stopPropagation();
			onEventTypeSelect(eventType);
		}
	}

	const counter = isFlatView
		? parentsCount
		: childrenCount > 0
		? `${childrenCount}${hasChildrenToLoad ? '+' : ''}`
		: '';

	return (
		<div className={rootClassName} onClick={onRootClick}>
			<Chip className='event-header-card__icons'>
				<div className={iconClassName} />
				<div className='search-by-parent' onClick={onFilterClick} />
				<div
					className={bookmarkClassName}
					onClick={onPinClicked}
					title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
				/>
			</Chip>
			{displayType !== CardDisplayType.STATUS_ONLY && (
				<>
					<div className='event-header-card__title' title={eventName}>
						<SearchableContent content={eventName} eventId={eventId} />
					</div>
					<Chip onClick={handleTypeClick}>{eventType}</Chip>
				</>
			)}
			{counter && <Counter>{counter}</Counter>}
			<div className='event-header-card__details'>
				{displayType !== CardDisplayType.STATUS_ONLY && (
					<>
						{elapsedTime && <Chip className='event-header-card__elapsed-time'>{elapsedTime}</Chip>}
						<Chip>
							<span className='event-header-card__time-label-full'>
								{formatTime(startTimestamp)}
							</span>
						</Chip>
						{eventType && <Chip onClick={handleTypeClick}>{eventType}</Chip>}
					</>
				)}
			</div>
		</div>
	);
}

type UnknownEventCardHeaderProps = Pick<
	EventCardHeaderBaseProps,
	| 'childrenCount'
	| 'event'
	| 'isActive'
	| 'isSelected'
	| 'disabled'
	| 'hasChildrenToLoad'
	| 'parentsCount'
	| 'isFlatView'
>;

const UnknownEventCardHeader = (props: UnknownEventCardHeaderProps) => {
	const {
		parentsCount = 0,
		childrenCount = 0,
		hasChildrenToLoad,
		event,
		isActive,
		isSelected,
		disabled,
		isFlatView,
	} = props;
	const rootClassName = createBemBlock(
		'event-header-card',
		'unknown',
		isSelected ? 'selected' : null,
		isActive ? 'active' : null,
		'not-selectable',
		disabled ? 'disabled' : null,
	);

	const iconClassName = createBemBlock(
		'event-status-icon',
		'unknown',
		isSelected ? 'selected' : null,
		isActive ? 'active' : null,
	);

	const counter = isFlatView
		? parentsCount
		: childrenCount > 0
		? `${childrenCount}${hasChildrenToLoad ? '+' : ''}`
		: '';

	return (
		<div className={rootClassName}>
			<div className={iconClassName} />
			<div className='event-header-card__title' title={event.eventName}>
				<SearchableContent content={event.eventName} eventId={event.eventId} />
			</div>
			<Counter>{counter}</Counter>
		</div>
	);
};

const EventCardHeader = (props: EventCardHeaderBaseProps) => {
	const { event } = props;
	const bookmarksStore = useBookmarksStore();
	const workspaceStore = useWorkspaceStore();
	const eventsDataStore = useEventsDataStore();

	if (event.isUnknown) {
		return <UnknownEventCardHeader {...props} />;
	}

	const hasChildrenToLoad = computed(() =>
		eventsDataStore.hasMoreChildren.get(event.eventId),
	).get();

	const isBookmarked = computed(
		() =>
			bookmarksStore.events.findIndex(bookmarkedEvent => bookmarkedEvent.id === event.eventId) !==
			-1,
	).get();

	return (
		<EventCardHeaderBase
			onFilterByParentEvent={workspaceStore.onFilterByParentEvent}
			isBookmarked={isBookmarked}
			hasChildrenToLoad={hasChildrenToLoad}
			toggleEventPin={bookmarksStore.toggleEventPin}
			{...props}
		/>
	);
};

export default observer(EventCardHeader);
