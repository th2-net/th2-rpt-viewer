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

import { observer } from 'mobx-react-lite';
import React from 'react';
import { useGraphDataStore, useWorkspaceEventStore } from '../../hooks';

export const EventListNavDown = observer(() => {
	const graphStore = useGraphDataStore();
	const eventsStore = useWorkspaceEventStore();

	return (
		<button
			className='actions-list__nav'
			onClick={() => {
				const [from, to] = eventsStore.changeEventsRange(-15);
				graphStore.setTimestampFromRange([from, to]);
			}}>
			<span className='down'></span>
			<span className='label'>Older</span>
		</button>
	);
});

export const EventListNavUp = observer(() => {
	const graphStore = useGraphDataStore();
	const eventsStore = useWorkspaceEventStore();

	return (
		<button
			className='actions-list__nav'
			onClick={() => {
				const [from, to] = eventsStore.changeEventsRange(graphStore.eventInterval);
				graphStore.setTimestampFromRange([from, to]);
			}}>
			<span className='up'></span>
			<span className='label'>Newer</span>
		</button>
	);
});
