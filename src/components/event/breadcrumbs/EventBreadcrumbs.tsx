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
import { EventTreeNode } from '../../../models/EventAction';
import EventBreadcrumbsItem from './EventBreadcrumbsItem';

interface Props {
	path: EventTreeNode[];
	onSelect: (eventTreeNode: EventTreeNode | null) => void;
	isLoadingSelectedPath: boolean;
}

export default function EventBreadcrumbs(props: Props) {
	const { path, onSelect, isLoadingSelectedPath } = props;
	return (
		<div className='event-breadcrumbs'>
			{isLoadingSelectedPath && <div className='event-breadcrumbs__loader' />}
			<EventBreadcrumbsItem
				eventNode='root'
				onSelect={() => onSelect(null)}
				key='root'
				isLast={!path.length}
			/>
			{path.map((eventNode, index) => (
				<EventBreadcrumbsItem
					eventNode={eventNode}
					onSelect={() => onSelect(eventNode)}
					key={eventNode.eventId}
					isLast={index === path.length - 1}
				/>
			))}
		</div>
	);
}
