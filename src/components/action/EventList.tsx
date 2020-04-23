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
import { useStores } from '../../hooks/useStores';
import { ActionNode, isAction } from '../../models/Action';
import { VirtualizedList } from '../VirtualizedList';
import StateSaverProvider from '../util/StateSaverProvider';
import { createBemElement } from '../../helpers/styleCreators';
import EventActionNode from '../EventActionNode';
import EventAction from '../../models/EventAction';
import '../../styles/action.scss';

interface Props {
	events: EventAction[];
	isMinified?: boolean;
	selectedEvents: string[];
	minimizeCards?: boolean;
}

export const EventList = observer(({
	events,
	isMinified = false,
	selectedEvents,
	minimizeCards = false,
}: Props) => {
	// eslint-disable-next-line @typescript-eslint/ban-types
	const getScrolledIndex = (scrolledActionId: Number | null, actions: ActionNode[]): Number | null => {
		const scrolledIndex = actions.findIndex(
			action => isAction(action) && action.id === Number(scrolledActionId),
		);

		return scrolledIndex !== -1 ? new Number(scrolledIndex) : null;
	};

	const {
		selectedStore,
		filterStore,
		viewStore,
		eventsStore,
	} = useStores();
	const list = React.useRef<VirtualizedList>();
	/*
		Number objects is used here because in some cases (eg one message / action was selected several times
		by diferent entities)
    	We can't understand that we need to scroll to the selected entity again when we are comparing primitive numbers.
    	Objects and reference comparison is the only way to handle numbers changing in this case.
	*/
	// eslint-disable-next-line @typescript-eslint/ban-types
	const [scrolledIndex, setScrolledIndex] = React.useState<Number | null>(
		getScrolledIndex(selectedStore.scrolledActionId, selectedStore.actions),
	);

	React.useEffect(() => {
		if (selectedStore.scrolledActionId != null) {
			setScrolledIndex(getScrolledIndex(selectedStore.scrolledActionId, selectedStore.actions));
		}
	}, [selectedStore.scrolledActionId]);

	const computeKey = (index: number): number => index;

	const renderEvent = (index: number): React.ReactElement =>
		<EventActionNode
			event={events[index]}
			panelArea={viewStore.panelArea}
			selectEvent={eventsStore.selectEvent}
			isMinified={isMinified}
			isSelected={selectedEvents.includes(events[index].eventId)} />;

	const listRootClass = createBemElement(
		'actions',
		'list',
		filterStore.isFilterApplied ? 'filter-applied' : null,
	);

	return (
		<div className="actions">
			<div className={listRootClass}>
				<StateSaverProvider>
					<VirtualizedList
						rowCount={events.length}
						ref={list as any}
						renderElement={renderEvent}
						computeItemKey={computeKey}
						scrolledIndex={scrolledIndex}
						selectedElements={new Map()}
						scrollHints={[]}
					/>
				</StateSaverProvider>
			</div>
		</div>
	);
}, {
	forwardRef: true,
});
