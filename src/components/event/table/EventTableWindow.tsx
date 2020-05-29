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
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import EventsColumn from './EventsColumn';
import '../../../styles/events.scss';
import EventBreadcrumbs from '../EventBreadcrumbs';
import useElementSize from '../../../hooks/useElementSize';
import CardDisplayType from '../../../util/CardDisplayType';
import EventMinimapColumn from './EventMinimapColumn';
import EventDetailInfoCard from '../EventDetailInfoCard';
import SplashScreen from '../../SplashScreen';
import SplitView from '../../SplitView';
import Empty from '../../Empty';
import { useEventWindowViewStore } from '../../../hooks/useEventWindowViewStore';

function EventTableWindow() {
	const eventsStore = useEventWindowStore();
	const viewStore = useEventWindowViewStore();
	const rootRef = React.useRef<HTMLDivElement>(null);
	const { width } = useElementSize(rootRef);

	// removing current selected item - it will be rendered in detail card
	const columns = (eventsStore.selectedNode?.parents ?? [])
		.filter(node => node.children && node.children.length > 0);
	const notMinfiedColumns = columns.slice(-3);
	const minimapDeep = columns.length - notMinfiedColumns.length;

	return (
		<div className='event-table-window' ref={rootRef}>
			<div className='event-table-window__breadcrumbs'>
				<EventBreadcrumbs
					rootEventsEnabled
					nodes={eventsStore.selectedPath}
					onSelect={eventsStore.selectNode}/>
			</div>
			<SplitView
				className='event-table-window__main'
				panelArea={viewStore.panelArea}
				onPanelAreaChange={viewStore.setPanelArea}
				leftPanelMinWidth={500}
				rightPanelMinWidth={500}>
				<div className='event-table-window__columns'>
					{
						eventsStore.selectedNode == null ? (
							eventsStore.isLoadingRootEvents ? (
								<SplashScreen/>
							) : (
								<EventsColumn
									nodesList={eventsStore.eventsIds}
									displayType={CardDisplayType.FULL}/>
							)
						) : (
							<>
								<EventMinimapColumn
									nodes={eventsStore.selectedPath[0].children!}
									deep={minimapDeep}/>
								{
									notMinfiedColumns.map((parentNode, i) => (
										parentNode.children?.length
											? <EventsColumn
												displayType={calculateCardLayout(i, notMinfiedColumns.length)}
												nodesList={parentNode.children}
												key={parentNode.id}/>
											: null
									))
								}
							</>
						)
					}
				</div>
				{
					eventsStore.selectedNode ? (
						<EventDetailInfoCard
							idNode={eventsStore.selectedNode}
							showSubNodes/>
					) : (
						<Empty description='Select event'/>
					)
				}
			</SplitView>
		</div>
	);
}

function calculateCardLayout(columnIndex: number, columnsLength: number): CardDisplayType {
	// last columns is always displayed
	if (columnsLength - columnIndex < 2) {
		return CardDisplayType.MINIMAL;
	}

	return CardDisplayType.STATUS_ONLY;
}

export default observer(EventTableWindow);
