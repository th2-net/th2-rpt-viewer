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
import EventBreadcrumbs from './EventBreadcrumbs';
import { EventWindowProvider } from '../../contexts/eventWindowContext';
import DraggableTab, { DraggableTabProps } from '../tabs/DraggableTab';
import Tab, { TabForwardedRefs } from '../tabs/Tab';
import EventWindowStore from '../../stores/EventsStore';
import { useStores } from '../../hooks/useStores';
import '../../styles/events.scss';

type EventsWindowTabProps = Omit<DraggableTabProps, 'children'> & {
	store: EventWindowStore;
};

const EventsWindowTab = observer((props: EventsWindowTabProps) => {
	const { store, ...tabProps } = props;
	const [isExpanded, setIsExpanded] = React.useState(false);
	const tabRefs = React.useRef<TabForwardedRefs>(null);

	return (
		<DraggableTab
			{...tabProps}
			ref={tabRefs}
			classNames={{ tab: isExpanded ? 'event-tab__expanded' : '' }}>
			<EventWindowProvider value={store}>
				<EventBreadcrumbs
					rootEventsEnabled
					nodes={store.selectedPath}
					onSelect={store.selectNode}
					onMouseEnter={(e, isMinified, fullBreadcrumsWidth) => {
						const contentRef = tabRefs.current?.contentRef;
						const tabRef = tabRefs.current?.tabRef;

						if (!contentRef || !tabRef || !isMinified) return;
						if (!isExpanded) setIsExpanded(true);
						const { left, right } = tabRef.getBoundingClientRect();
						const contentWidth = contentRef.getBoundingClientRect().width;
						const clientWidth = document.documentElement.clientWidth;
						const widthDiff = Math.round(fullBreadcrumsWidth - contentWidth);

						let widthRemainder = widthDiff;
						let startX = Math.max(9, left - widthDiff / 2);
						widthRemainder -= (left - startX);
						const endX = Math.min(clientWidth - 9, right + widthRemainder);
						widthRemainder -= (endX - right);

						if (widthRemainder > 0) {
							startX = Math.max(10, startX - widthRemainder);
						}
						const fullTabWidth = endX - startX;

						tabRef.style.transform = `translate(${startX - left}px, 0)`;
						tabRef.style.width = `${fullTabWidth < clientWidth ? fullTabWidth : clientWidth}px`;
					}}
					onMouseLeave={() => {
						if (tabRefs.current?.tabRef) {
							tabRefs.current.tabRef.style.transform = 'translate(0, 0)';
							tabRefs.current.tabRef.style.width = '100%';
						}
						setIsExpanded(false);
					}}/>
			</EventWindowProvider>
		</DraggableTab>
	);
});

export default EventsWindowTab;

interface EventsWindowTabPreviewProps {
	store: EventWindowStore;
	isSelected: boolean;
}

export const EventsWindowTabPreview = ({ store, isSelected }: EventsWindowTabPreviewProps) => {
	const { windowsStore } = useStores();
	const attachedMessagesIds = windowsStore.attachedMessagesIds.get(store.color);
	const color = attachedMessagesIds?.length ? store.color : undefined;

	return (
		<Tab color={color} isDragging={true} isSelected={isSelected}>
			<EventWindowProvider value={store}>
				<EventBreadcrumbs
					rootEventsEnabled
					nodes={store.selectedPath} />
			</EventWindowProvider>
		</Tab>
	);
};
