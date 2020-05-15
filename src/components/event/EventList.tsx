/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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

/* eslint-disable no-new-wrappers */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import EventTree from './EventTree';
import { VirtualizedList } from '../VirtualizedList';
import StateSaverProvider from '../util/StateSaverProvider';
import { createBemElement } from '../../helpers/styleCreators';
import Empty from '../Empty';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import SplashScreen from '../SplashScreen';
import '../../styles/action.scss';

const EventList = () => {
	const eventWindowStore = useEventWindowStore();
	const list = React.useRef<VirtualizedList>();

	const computeKey = (index: number): number => index;

	const renderEvent = (index: number): React.ReactElement =>
		<EventTree
			event={eventWindowStore.events[index]}
			path={[]} />;

	const listRootClass = createBemElement(
		'actions',
		'list',
		eventWindowStore.filterStore.isFilterApplied ? 'filter-applied' : null,
	);

	if (eventWindowStore.isLoadingRootEvents) {
		return <SplashScreen />;
	}

	if (!eventWindowStore.isLoadingRootEvents && eventWindowStore.events.length === 0) {
		return <Empty description="No events" />;
	}

	return (
		<div className="actions">
			<div className={listRootClass} style={{ overflow: 'auto' }}>
				<StateSaverProvider>
					<VirtualizedList
						rowCount={eventWindowStore.events.length}
						ref={list as any}
						computeItemKey={computeKey}
						scrolledIndex={null}
						selectedElements={new Map()}
						itemRenderer={renderEvent}
					/>
				</StateSaverProvider>
			</div>
		</div>
	);
};

export default observer(EventList, { forwardRef: true });
