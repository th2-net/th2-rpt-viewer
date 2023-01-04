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

import { useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { createBemElement } from 'helpers/styleCreators';
import { ButtonBase } from 'components/buttons/ButtonBase';
import { EventListNavigation } from './EventListNavigation';
import EventsFilterPanel from './filter/EventsFilterPanel';
import { useEventsStore } from '../hooks/useEventsStore';
import useEventsDataStore from '../hooks/useEventsDataStore';
import { EventTreeNode } from '../models/Event';
import EventBreadcrumbs from './breadcrumbs/EventBreadcrumbs';
import { EventsIntervalInput } from './EventsIntervalInput';

function EventsPanelHeader() {
	const eventsStore = useEventsStore();
	const eventDataStore = useEventsDataStore();

	const flattenButtonClassName = createBemElement(
		'event-window-header',
		'flat-button',
		eventsStore.viewStore.flattenedListView ? 'active' : null,
	);

	const onBreadcrumbItemClick = useCallback(
		(node: EventTreeNode | null) => {
			if (node) {
				eventsStore.scrollToEvent(node.eventId);
			}
			eventsStore.selectNode(node);
		},
		[eventsStore],
	);

	return (
		<div className='window__controls'>
			<div className='window__breadcrumbs'>
				<EventBreadcrumbs
					isLoadingSelectedPath={eventsStore.isLoadingTargetNode}
					path={eventsStore.selectedPath}
					onSelect={onBreadcrumbItemClick}
				/>
			</div>
			<div className='event-window-header'>
				<EventsFilterPanel />
				<ButtonBase
					role='button'
					onClick={eventsStore.viewStore.toggleFlattenEventListView}
					className={flattenButtonClassName}>
					Flat view
				</ButtonBase>
				<EventListNavigation />
				<EventsIntervalInput />
				{eventDataStore.isLoading && (
					<div className='event-window-header__loader'>
						Resolving events<span>.</span>
						<span>.</span>
						<span>.</span>
					</div>
				)}
			</div>
		</div>
	);
}

export default observer(EventsPanelHeader);
