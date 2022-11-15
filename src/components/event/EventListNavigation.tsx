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

import moment from 'moment';
import { observer } from 'mobx-react-lite';
import React from 'react';
import { useGraphDataStore, useWorkspaceEventStore } from '../../hooks';
import { SearchDirection } from '../../models/search/SearchDirection';

interface Props {
	direction: SearchDirection.Next | SearchDirection.Previous;
}

export const EventListArrowNav = observer((props: Props) => {
	const graphStore = useGraphDataStore();
	const eventsStore = useWorkspaceEventStore();

	const label = props.direction === SearchDirection.Next ? 'Newer' : 'Older';

	const getNextEvents = () => {
		const offset = props.direction === SearchDirection.Next ? 1 : -1;

		const timestampFrom = moment
			.utc(eventsStore.filterStore.timestampFrom)
			.add(graphStore.eventInterval * offset, 'minutes')
			.valueOf();
		const timestampTo = moment
			.utc(timestampFrom)
			.add(graphStore.eventInterval, 'minutes')
			.valueOf();

		eventsStore.changeEventsRange([timestampFrom, timestampTo]);
	};

	return (
		<button className='actions-list__nav' onClick={getNextEvents}>
			<span className={label.toLowerCase()}></span>
			<span className='label'>{label}</span>
		</button>
	);
});
