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

import React from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import EventCardHeader from '../EventCardHeader';
import EventCardSkeleton from '../EventCardSkeleton';
import CardDisplayType from '../../../util/CardDisplayType';
import { createBemBlock } from '../../../helpers/styleCreators';
import useEventsDataStore from '../../../hooks/useEventsDataStore';
import { useEvent, useExperimentalApiEventStore } from './ExperimentalAPIEventStore';

interface EventTreeProps {
	eventId: string;
}

function EventTree({ eventId }: EventTreeProps) {
	const eventsStore = useExperimentalApiEventStore();
	const eventsDataStore = useEventsDataStore();

	const { event } = useEvent(eventId === 'd69b203c-a924-11ec-83e5-d71831cc80d6' ? '' : eventId);

	const parents = computed(() => {
		return eventsStore.getParentNodes(eventId, eventsStore.cache);
	}).get();

	const childrenCount = computed(
		() => eventsStore.parentsChildrenMapMap.get(eventId)?.length || 0,
	).get();

	const hasChildren = computed(
		() => !eventsStore.hasMoreChildren.has(eventId) || eventsStore.hasMoreChildren.get(eventId),
	).get();

	const isLoadingSiblings = computed(
		() =>
			event && event.parentEventId && eventsDataStore.isLoadingChildren.get(event.parentEventId),
	).get();

	const onExpandClick = () => {
		eventsStore.toggleExpand(eventId);
		eventsStore.fetchChildren(eventId);
	};

	const showLoadButton = computed(() => {
		const parentId = event?.parentEventId;
		let isLastChild = false;
		let parentHasMoreChilds = false;

		if (parentId) {
			const siblings = eventsStore.getChildrenNodes(parentId);

			isLastChild = siblings.length > 0 && siblings[siblings.length - 1] === eventId;
			parentHasMoreChilds = eventsDataStore.hasUnloadedChildren.get(parentId) === true;
		}

		return isLastChild && parentHasMoreChilds;
	}).get();

	const isSelected = computed(() =>
		eventsStore.selectedPath.some(n => n.eventId === eventId),
	).get();

	let expandIconStatus: 'expanded' | 'hidden' | 'loading' | 'none';

	if (childrenCount === 0 && !hasChildren) {
		expandIconStatus = 'none';
	} else if (eventsStore.isExpanded.get(eventId)) {
		expandIconStatus = 'expanded';
	} else {
		expandIconStatus = 'hidden';
	}

	function loadMoreSiblings() {
		if (event && event.parentEventId != null) {
			eventsStore.fetchChildren(event.parentEventId);
		}
	}

	const onNodeSelect = React.useCallback(() => {
		eventsStore.selectEvent(event);
	}, [event]);

	const nestingLevel = 20 * parents.length;

	return (
		<>
			<div className='event-tree-card' style={{ paddingLeft: nestingLevel }}>
				<ExpandIcon
					status={expandIconStatus}
					className='event-card__children-icon'
					onClick={onExpandClick}
				/>
				{event ? (
					<EventCardHeader
						childrenCount={childrenCount}
						event={event}
						displayType={CardDisplayType.MINIMAL}
						onSelect={onNodeSelect}
						isSelected={isSelected}
						isActive={
							eventsStore.selectedPath.length > 0 &&
							eventsStore.selectedPath[eventsStore.selectedPath.length - 1].eventId === eventId
						}
					/>
				) : (
					<EventCardSkeleton />
				)}
			</div>
			{showLoadButton && !isLoadingSiblings && (
				<button onClick={loadMoreSiblings} className='actions-list__load-button'>
					Load more
				</button>
			)}
			{showLoadButton && isLoadingSiblings && <div className='actions-list__spinner' />}
		</>
	);
}

export default observer(EventTree);

interface Props {
	status: 'expanded' | 'hidden' | 'loading' | 'none';
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
	disabled?: boolean;
}

function ExpandIcon(props: Props) {
	const { status, onClick, className, style, disabled = false } = props;

	const rootClass = createBemBlock(
		'expand-icon',
		status,
		className || null,
		disabled ? 'disabled' : null,
	);

	return (
		<div
			className={rootClass}
			style={style}
			onClick={() => {
				if (!disabled && onClick) {
					onClick();
				}
			}}>
			{props.status === 'loading' ? (
				<>
					<div className='expand-icon__dot' />
					<div className='expand-icon__dot' />
					<div className='expand-icon__dot' />
				</>
			) : null}
		</div>
	);
}
