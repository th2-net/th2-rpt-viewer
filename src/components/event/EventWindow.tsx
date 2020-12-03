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
import { observer } from 'mobx-react-lite';
import EventTreeView from './tree/EventTreeView';
import EventWindowHeader from './EventWindowHeader';
import FlatEventView from './flat-event-list/FlatEventView';
import { useEventWindowViewStore } from '../../hooks';
import '../../styles/events.scss';

interface EventWindowProps {
	isActive: boolean;
}

const EventWindow = (props: EventWindowProps) => {
	const viewStore = useEventWindowViewStore();
	const { isActive } = props;

	return (
		<div className='window'>
			<div className='window__controls'>
				<EventWindowHeader isWindowActive={isActive} />
			</div>
			<div className='window__body'>
				{viewStore.flattenedListView ? <FlatEventView /> : <EventTreeView />}
			</div>
		</div>
	);
};

export default observer(EventWindow);
