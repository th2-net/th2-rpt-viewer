/** *****************************************************************************
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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { Virtuoso } from 'react-virtuoso';
import EventTree from './EventTree';
import StateSaverProvider from '../../util/StateSaverProvider';
import { createBemElement } from '../../../helpers/styleCreators';
import Empty from '../../Empty';
import SplashScreen from '../../SplashScreen';
import '../../../styles/action.scss';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';

function EventTreeList() {
	const eventWindowStore = useEventWindowStore();

	const computeKey = (index: number) => eventWindowStore.nodesList[index].id;

	const renderEvent = (index: number): React.ReactElement => (
		<ItemListWrapper index={index}/>
	);

	const listRootClass = createBemElement(
		'actions',
		'list',
		eventWindowStore.filterStore.isFilterApplied ? 'filter-applied' : null,
	);

	if (eventWindowStore.isLoadingRootEvents) {
		return <SplashScreen/>;
	}

	if (!eventWindowStore.isLoadingRootEvents && eventWindowStore.eventsIds.length === 0) {
		return <Empty description="No events"/>;
	}

	return (
		<div className="actions">
			<div className={listRootClass} style={{ overflow: 'auto' }}>
				<StateSaverProvider>
					<Virtuoso
						totalCount={eventWindowStore.nodesList.length}
						computeItemKey={computeKey}
						style={{ height: '100%' }}
						overscan={3}
						item={renderEvent}
					/>
				</StateSaverProvider>
			</div>
		</div>
	);
}

const ItemListWrapper = observer(({ index }: { index: number }) => {
	const eventWindowStore = useEventWindowStore();

	return (
		<EventTree idNode={eventWindowStore.nodesList[index]}/>
	);
});

export default observer(EventTreeList);
