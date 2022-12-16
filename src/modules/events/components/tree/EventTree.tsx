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

import React, { useMemo } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { EventTreeNode } from 'models/EventAction';
import { createBemBlock } from 'helpers/styleCreators';
import { Paper } from 'components/Paper';
import { Button } from 'components/buttons/Button';
import useEventsDataStore from '../../hooks/useEventsDataStore';
import { useEventsStore } from '../../hooks/useEventsStore';
import EventCardHeader from '../event-card/EventCardHeader';
import CardDisplayType from '../../models/CardDisplayType';

interface EventTreeProps {
	eventTreeNode: EventTreeNode;
	parentNodes?: EventTreeNode[];
}

function EventTree({ eventTreeNode }: EventTreeProps) {
	const eventsStore = useEventsStore();
	const eventsDataStore = useEventsDataStore();

	React.useEffect(() => {
		const children = eventsDataStore.parentChildrensMap.get(eventTreeNode.eventId);
		if (eventsDataStore.childrenAreUnknown.get(eventTreeNode.eventId) && !children) {
			eventsDataStore.childrenAreUnknown.set(eventTreeNode.eventId, false);
			eventsDataStore.loadChildren(eventTreeNode.eventId);
		}
	}, []);

	const parents = useMemo(
		() => eventsStore.getParentNodes(eventTreeNode.eventId, eventsDataStore.eventsCache),
		[eventTreeNode],
	);

	const childrenCount = computed(() => {
		const children = eventsDataStore.parentChildrensMap.get(eventTreeNode.eventId);
		if (children) return children.length;

		return eventsDataStore.targetNodeParents.some(
			parentNode => parentNode.eventId === eventTreeNode.eventId,
		)
			? 1
			: 0;
	}).get();

	const isLoadingSiblings = computed(() =>
		Boolean(
			eventTreeNode.parentId && eventsDataStore.isLoadingChildren.get(eventTreeNode.parentId),
		),
	).get();

	const onExpandClick = React.useCallback(
		() => eventsStore.toggleNode(eventTreeNode),
		[eventTreeNode],
	);

	const showLoadButton = computed(() => {
		if (eventTreeNode.parentId) {
			const childrenData = eventsDataStore.childrenData.get(eventTreeNode.parentId);

			return (
				childrenData &&
				childrenData.lastChild === eventTreeNode.eventId &&
				eventsDataStore.hasMoreChildren.get(eventTreeNode.parentId)
			);
		}
		return false;
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
			eventsDataStore.loadNextChildren(eventTreeNode.parentId);
		}
	}

	const onEventTypeSelect = React.useCallback((eventType: string) => {
		const defaultFilter = eventsStore.filterStore.getDefaultEventFilter();
		if (!defaultFilter) return;
		defaultFilter.type.values.push(eventType);
		eventsStore.filterStore.setEventsFilter(defaultFilter);
		eventsStore.filterStore.setIsOpen(true);
	}, []);

	const nestingLevel = 48 + parents.length * 16;

	return (
		<>
			<div className='event-list-item event-tree-card'>
				<Paper className='event-tree-card__indent' style={{ width: nestingLevel }}>
					<ExpandButton
						status={expandIconStatus}
						onClick={onExpandClick}
						disabled={eventsStore.isLoadingTargetNode}
					/>
				</Paper>
				<EventCardHeader
					childrenCount={childrenCount}
					event={eventTreeNode}
					displayType={CardDisplayType.MINIMAL}
					onClick={eventsStore.selectNode}
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
			{showLoadButton && (
				<div className='event-tree-card__footer'>
					{isLoadingSiblings ? (
						<div className='event-tree-card__spinner' />
					) : (
						<Button variant='outlined' onClick={loadMoreSiblings}>
							Load more
						</Button>
					)}
				</div>
			)}
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

function ExpandButton(props: Props) {
	const { status, onClick, className, style, disabled = false } = props;

	if (status === 'none') return null;

	const rootClass = createBemBlock(
		'expand-icon',
		status,
		className || null,
		disabled ? 'disabled' : null,
	);

	return (
		<button
			className='button-base expand-button'
			onClick={() => {
				if (!disabled && onClick) {
					onClick();
				}
			}}>
			<div className={rootClass} style={style}>
				{props.status === 'loading' && (
					<>
						<div className='expand-icon__dot' />
						<div className='expand-icon__dot' />
						<div className='expand-icon__dot' />
					</>
				)}
			</div>
		</button>
	);
}