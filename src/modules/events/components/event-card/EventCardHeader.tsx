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
import { formatTime, getElapsedTime } from 'helpers/date';
import { createBemBlock } from 'helpers/styleCreators';
import { EventTreeNode } from 'models/EventAction';
import { useBookmarksStore, useWorkspaceStore } from 'hooks/index';
import { getEventStatus } from 'helpers/event';
import SearchableContent from '../search/SearchableContent';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { ChildrenCount } from './ChildrenCount';
import CardDisplayType from '../../../../models/util/CardDisplayType';

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
		childrenCount,
		isFlatView = false,
		parentsCount = 0,
		rootStyle = {},
		disabled = false,
		isBookmarked = false,
		toggleEventPin,
		onFilterByParentEvent,
		hasChildrenToLoad = false,
	} = props;
	const { eventId, eventName, eventType, startTimestamp, endTimestamp, isUnknown } = event;

	const status = isUnknown ? 'unknown' : getEventStatus(event);

	const elapsedTime =
		endTimestamp && startTimestamp ? getElapsedTime(startTimestamp, endTimestamp) : null;

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

	return (
		<div className={rootClassName} onClick={onRootClick} style={rootStyle}>
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
						<span className='event-header-card__time-label-full'>{formatTime(startTimestamp)}</span>
					</div>
					{eventType && (
						<span className='event-header-card__event-type' onClick={handleTypeClick}>
							{eventType}
						</span>
					)}
				</>
			) : null}
			{isFlatView && parentsCount > 0 ? <ChildrenCount text={parentsCount.toString()} /> : null}
			{displayType !== CardDisplayType.STATUS_ONLY &&
				childrenCount !== undefined &&
				childrenCount > 0 && (
					<ChildrenCount text={childrenCount.toString().concat(hasChildrenToLoad ? '+' : '')} />
				)}
			{!isUnknown && <div className='search-by-parent' onClick={onFilterClick} />}
			{!isUnknown && (
				<div
					className={bookmarkClassName}
					onClick={onPinClicked}
					title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
				/>
			)}
		</div>
	);
}

const EventCardHeader = (props: EventCardHeaderBaseProps) => {
	const { event } = props;
	const bookmarksStore = useBookmarksStore();
	const workspaceStore = useWorkspaceStore();
	const eventsDataStore = useEventsDataStore();

	const hasChildrenToLoad = computed(() =>
		eventsDataStore.hasUnloadedChildren.get(event.eventId),
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
