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

import { formatTimestamp } from 'helpers/date';
import { observer } from 'mobx-react-lite';
import { SearchDirection } from 'models/SearchDirection';
import { CalendarIcon } from 'components/icons/CalendarIcon';
import { ButtonBase } from 'components/buttons/ButtonBase';
import { Chip } from 'components/Chip';
import { EventsArrowIcon } from 'components/icons/EventsArrowIcon';
import { useEventsStore } from '../hooks/useEventsStore';
import '../../../styles/events.scss';

export const EventListNavigation = observer(() => {
	const eventsStore = useEventsStore();
	const timestamp = eventsStore.filterStore.timestampFrom;

	const getNextEvents = eventsStore.eventDataStore.findClosestEvent.bind(
		eventsStore,
		SearchDirection.Next,
	);
	const getPrevEvents = eventsStore.eventDataStore.findClosestEvent.bind(
		eventsStore,
		SearchDirection.Previous,
	);

	return (
		<div className='events-nav'>
			<ButtonBase onClick={getPrevEvents}>
				<Chip className='events-nav__nav-circle left'>
					<EventsArrowIcon />
				</Chip>
				Show previous
			</ButtonBase>
			<span className='events-nav__timestamp'>{formatTimestamp(timestamp)}</span>
			<ButtonBase onClick={getNextEvents}>
				Show next
				<Chip className='events-nav__nav-circle'>
					<EventsArrowIcon />
				</Chip>
			</ButtonBase>
			<CalendarIcon className='events-nav__calendar-button' />
		</div>
	);
});
