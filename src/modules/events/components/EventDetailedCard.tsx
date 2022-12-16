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

import { useEffect, useMemo, useState } from 'react';
import { EventTreeNode } from 'models/EventAction';
import SplashScreen from 'components/SplashScreen';
import Empty from 'components/util/Empty';
import EventCard from './event-card/EventCard';
import EventCardHeader from './event-card/EventCardHeader';
import { useEvent } from '../hooks/useEvent';
import { EventAction } from '../models/Event';

interface Props {
	node: EventTreeNode;
	parentNodes?: EventTreeNode[];
	children?: React.ReactNode;
	isBookmarked?: boolean;
	onBookmarkClick?: (node: EventAction) => void;
}

function EventDetailedCard(props: Props) {
	const { node, children, parentNodes = [], isBookmarked = false, onBookmarkClick } = props;

	const [selectedNode, setSelectedNode] = useState<EventTreeNode>(node);

	useEffect(() => {
		setSelectedNode(node);
	}, [node]);

	const { event, isError } = useEvent(selectedNode.eventId);

	const toggleBookmark = useMemo(() => {
		if (onBookmarkClick) {
			return (e: EventAction) => {
				if (onBookmarkClick) {
					onBookmarkClick(e);
				}
			};
		}
		return undefined;
	}, [onBookmarkClick]);

	if (isError) {
		return <Empty description='Error occured while loading event' />;
	}

	if (!event) {
		return (
			<div className='event-detail-info'>
				{children}
				<SplashScreen />
			</div>
		);
	}

	return (
		<div className='event-detail-info'>
			{parentNodes.length > 0 && (
				<div className='event-detail-info__parents'>
					{parentNodes.map(eventNode => (
						<EventCardHeader
							key={eventNode.eventId}
							event={eventNode}
							onClick={!eventNode.isUnknown ? e => setSelectedNode(e) : undefined}
							isActive={selectedNode === eventNode}
						/>
					))}
					<EventCardHeader key={node.eventId} event={node} onClick={setSelectedNode} />
				</div>
			)}
			<EventCard
				isBookmarked={isBookmarked}
				event={event}
				onBookmarkClick={toggleBookmark}
				isUnknown={selectedNode.isUnknown}
			/>
		</div>
	);
}

export default EventDetailedCard;
