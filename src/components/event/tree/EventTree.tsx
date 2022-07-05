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
import { useWorkspaceEventStore } from '../../../hooks';
import { EventTreeNode } from '../../../models/EventAction';
import CardDisplayType from '../../../util/CardDisplayType';
import { createBemBlock } from '../../../helpers/styleCreators';
import { formatTime } from '../../../helpers/date';
import useEventsDataStore from '../../../hooks/useEventsDataStore';

interface EventTreeProps {
	eventTreeNode: EventTreeNode;
}

function EventTree({ eventTreeNode }: EventTreeProps) {
	const eventsStore = useWorkspaceEventStore();
	const eventsDataStore = useEventsDataStore();

	React.useEffect(() => {
		const children = eventsDataStore.parentChildrensMap.get(eventTreeNode.eventId);
		if (eventsDataStore.childrenAreUnknown.get(eventTreeNode.eventId) && !children) {
			eventsDataStore.childrenAreUnknown.set(eventTreeNode.eventId, false);
			eventsDataStore.loadChildren(eventTreeNode.eventId);
		}
	}, []);

	const parents = computed(() =>
		eventsStore.getParentNodes(eventTreeNode.eventId, eventsDataStore.eventsCache),
	).get();

	const childrenCount = computed(() => {
		const children = eventsDataStore.parentChildrensMap.get(eventTreeNode.eventId);
		if (children) return children.length;

		return eventsDataStore.targetNodeParents.some(
			parentNode => parentNode.eventId === eventTreeNode.eventId,
		)
			? 1
			: 0;
	}).get();

	const isLoadingSiblings = computed(
		() => eventTreeNode.parentId && eventsDataStore.isLoadingChildren.get(eventTreeNode.parentId),
	).get();

	const onExpandClick = () => eventsStore.toggleNode(eventTreeNode);

	const showLoadButton = computed(() => {
		let isLastChild = false;
		let parentHasMoreChilds = false;

		if (eventTreeNode.parentId !== null) {
			const siblings = eventsStore.getChildrenNodes(eventTreeNode.parentId);

			isLastChild =
				siblings.length > 0 && siblings[siblings.length - 1].eventId === eventTreeNode.eventId;
			parentHasMoreChilds =
				eventsDataStore.hasUnloadedChildren.get(eventTreeNode.parentId) === true;
		}

		return isLastChild && parentHasMoreChilds;
	}).get();

	const isSelected = computed(() =>
		eventsStore.selectedPath.some(n => n.eventId === eventTreeNode.eventId),
	).get();

	let expandIconStatus: 'expanded' | 'hidden' | 'loading' | 'none';

	if (childrenCount === 0) {
		expandIconStatus = 'none';
	} else if (eventsStore.isExpandedMap.get(eventTreeNode.eventId)) {
		expandIconStatus = 'expanded';
	} else {
		expandIconStatus = 'hidden';
	}

	function loadMoreSiblings() {
		if (eventTreeNode.parentId) {
			eventsDataStore.isLoadingChildren.set(eventTreeNode.parentId, true);
			eventsDataStore.loadChildren(eventTreeNode.parentId);
		}
	}

	const onNodeSelect = React.useCallback(() => {
		eventsStore.selectNode(eventTreeNode);
	}, [eventTreeNode]);

	const onEventTypeSelect = (eventType: string) => {
		const defaultFilter = eventsStore.filterStore.getDefaultEventFilter();
		if (!defaultFilter) return;
		defaultFilter.type.values.push(eventType);
		eventsStore.filterStore.setEventsFilter(defaultFilter);
		eventsStore.filterStore.setIsOpen(true);
	};

	const nestingLevel = 20 * parents.length;

	const hideTimestampsForUknownEvent =
		eventTreeNode.isUnknown &&
		eventsStore.selectedPathTimestamps &&
		eventsStore.selectedPathTimestamps.startEventId ===
			eventsStore.selectedPathTimestamps.endEventId &&
		eventsStore.selectedPathTimestamps.startEventId === eventTreeNode.eventId;

	return (
		<>
			{!hideTimestampsForUknownEvent &&
				eventsStore.selectedPathTimestamps?.startEventId === eventTreeNode.eventId &&
				eventsStore.selectedPathTimestamps.startTimestamp && (
					<div className='event-tree-timestamp'>
						<div className='event-tree-timestamp__value'>
							{formatTime(eventsStore.selectedPathTimestamps.startTimestamp)}
						</div>
						<div className='event-tree-timestamp__icon' />
					</div>
				)}
			<div className='event-tree-card' style={{ paddingLeft: nestingLevel }}>
				<ExpandIcon
					status={expandIconStatus}
					className='event-card__children-icon'
					onClick={onExpandClick}
					disabled={eventsStore.isLoadingTargetNode}
				/>
				<EventCardHeader
					childrenCount={childrenCount}
					event={eventTreeNode}
					displayType={CardDisplayType.MINIMAL}
					onSelect={eventTreeNode.isUnknown ? undefined : onNodeSelect}
					onEventTypeSelect={onEventTypeSelect}
					isSelected={isSelected}
					isActive={
						eventsStore.selectedPath.length > 0 &&
						eventsStore.selectedPath[eventsStore.selectedPath.length - 1].eventId ===
							eventTreeNode.eventId
					}
					disabled={eventsStore.isLoadingTargetNode}
				/>
			</div>
			{!hideTimestampsForUknownEvent &&
				eventsStore.selectedPathTimestamps?.endEventId === eventTreeNode.eventId &&
				eventsStore.selectedPathTimestamps.endTimestamp && (
					<div className='event-tree-timestamp end'>
						<div className='event-tree-timestamp__value'>
							{formatTime(eventsStore.selectedPathTimestamps.endTimestamp)}
						</div>
						<div className='event-tree-timestamp__icon' />
					</div>
				)}
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
