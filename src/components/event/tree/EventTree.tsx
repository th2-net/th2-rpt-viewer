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
import { observer } from 'mobx-react-lite';
import PanelArea from '../../../util/PanelArea';
import EventCardHeader from '../EventCardHeader';
import { useEventWindowViewStore, useWorkspaceEventStore } from '../../../hooks';
import EventCardSkeleton from '../EventCardSkeleton';
import { EventTreeNode } from '../../../models/EventAction';
import { getEventNodeParents } from '../../../helpers/event';
import CardDisplayType from '../../../util/CardDisplayType';
import { createBemBlock } from '../../../helpers/styleCreators';

interface EventTreeProps {
	eventTreeNode: EventTreeNode;
}

function EventTree({ eventTreeNode }: EventTreeProps) {
	const eventWindowStore = useWorkspaceEventStore();
	const viewStore = useEventWindowViewStore();

	const onExpandClick = () => eventWindowStore.toggleNode(eventTreeNode);

	let expandIconStatus: 'expanded' | 'hidden' | 'loading' | 'none';

	if (eventTreeNode.childList.length === 0) {
		expandIconStatus = 'none';
	} else if (eventWindowStore.isExpandedMap.get(eventTreeNode.eventId)) {
		expandIconStatus = 'expanded';
	} else {
		expandIconStatus = 'hidden';
	}

	// const nestingLevel =
	// 	(viewStore.eventsPanelArea === PanelArea.P25 ? 20 : 35) *
	// 	getEventNodeParents(eventTreeNode).length;

	const nestingLevel = 20 * getEventNodeParents(eventTreeNode).length;

	return (
		<div className='event-tree-card' style={{ paddingLeft: nestingLevel }}>
			<ExpandIcon
				status={expandIconStatus}
				className='event-card__children-icon'
				onClick={onExpandClick}
			/>
			{eventTreeNode ? (
				<EventCardHeader
					childrenCount={eventTreeNode.childList.length}
					event={eventTreeNode}
					displayType={CardDisplayType.MINIMAL}
					onSelect={() => eventWindowStore.selectNode(eventTreeNode)}
					isSelected={eventWindowStore.isNodeSelected(eventTreeNode)}
					isActive={
						eventWindowStore.selectedPath.length > 0 &&
						eventWindowStore.selectedPath[eventWindowStore.selectedPath.length - 1].eventId ===
							eventTreeNode.eventId
					}
				/>
			) : (
				<EventCardSkeleton />
			)}
		</div>
	);
}

export default observer(EventTree);

interface Props {
	status: 'expanded' | 'hidden' | 'loading' | 'none';
	onClick?: React.MouseEventHandler;
	className?: string;
	style?: React.CSSProperties;
}

function ExpandIcon(props: Props) {
	const rootClass = createBemBlock('expand-icon', props.status);

	return (
		<div className={`${rootClass} ${props.className}`} style={props.style} onClick={props.onClick}>
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
