/** ****************************************************************************
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
import { observer } from 'mobx-react-lite';
import SearchInput from '../search/SearchInput';
import EventsFilterPanel from '../filter/EventsFilterPanel';
import { useWorkspaceEventStore } from '../../hooks';
import { createBemElement } from '../../helpers/styleCreators';

interface EventWindowHeaderProps {
	isWindowActive: boolean;
}

function EventWindowHeader(props: EventWindowHeaderProps) {
	const { isWindowActive } = props;
	const eventStore = useWorkspaceEventStore();

	const flattenButtonClassName = createBemElement(
		'event-window-header',
		'flat-button',
		eventStore.viewStore.flattenedListView ? 'active' : null,
	);

	return (
		<div className='event-window-header'>
			<div className='event-window-header__group'>
				<div className='event-window-header__search'>
					<SearchInput disabled={!isWindowActive} />
				</div>
				<EventsFilterPanel />
				<div
					role='button'
					onClick={eventStore.viewStore.toggleFlatttenEventListView}
					className={flattenButtonClassName}>
					Flat view
				</div>
			</div>
		</div>
	);
}

export default observer(EventWindowHeader);
