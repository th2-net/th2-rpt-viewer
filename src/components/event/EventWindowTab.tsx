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
import EventBreadcrumbs, { EventBreadcrumbsForwardingRef } from './EventBreadcrumbs';
import { EventWindowProvider } from '../../contexts/eventWindowContext';
import DraggableTab, { DraggableTabProps } from '../tabs/DraggableTab';
import Tab, { TabForwardedRefs } from '../tabs/Tab';
import EventWindowStore, { EventIdNode } from '../../stores/EventsStore';
import '../../styles/events.scss';

type EventsWindowTabProps = Omit<DraggableTabProps, 'children'> & {
	store: EventWindowStore;
};

const EventsWindowTab = observer((props: EventsWindowTabProps) => {
	const { store, ...tabProps } = props;
	const breadcrumbsRef = React.useRef<EventBreadcrumbsForwardingRef>(null);
	const [isExpanded, setIsExpanded] = React.useState(false);
	const tabRefs = React.useRef<TabForwardedRefs>(null);

	React.useEffect(() => {
		if (tabRefs.current?.tabRef) {
			tabRefs.current?.tabRef.addEventListener('mouseover', expand);
			tabRefs.current?.tabRef.addEventListener('mouseleave', collapse);
		}

		return () => {
			if (tabRefs.current?.tabRef) {
				tabRefs.current?.tabRef.removeEventListener('mouseover', expand);
				tabRefs.current?.tabRef.removeEventListener('mouseleave', collapse);
			}
		};
	  }, []);

	const expand = () => {
		if (breadcrumbsRef.current) {
			breadcrumbsRef.current?.expand();
		}
	};

	const collapse = () => {
		if (breadcrumbsRef.current) {
			breadcrumbsRef.current?.collapse();
		}
	};

	return (
		<DraggableTab
			{...tabProps}
			ref={tabRefs}
			classNames={{ tab: isExpanded ? 'event-tab__expanded' : '' }}>
			<EventWindowProvider value={store}>
				<EventBreadcrumbs
					onExpand={newExpandeState => setIsExpanded(newExpandeState)}
					ref={breadcrumbsRef}
					nodes={store.selectedPath}
					onSelect={(idNode: EventIdNode | null) => {
						store.selectNode(idNode);
						if (idNode) {
							store.scrollToEvent(idNode);
						}
					}} />
			</EventWindowProvider>
		</DraggableTab>
	);
});

export default EventsWindowTab;

interface EventsWindowTabPreviewProps {
	store: EventWindowStore;
	isSelected: boolean;
}

export const EventsWindowTabPreview = ({ store, isSelected }: EventsWindowTabPreviewProps) => (
	<Tab color={store.color} isDragging={true} isSelected={isSelected}>
		<EventWindowProvider value={store}>
			<EventBreadcrumbs
				nodes={store.selectedPath}
				showAll={true}/>
		</EventWindowProvider>
	</Tab>
);
