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

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import BookmarksPanel from 'modules/bookmarks';
import SearchPanel from 'modules/search';
import { getItemId } from 'helpers/event';
import EventWindow from '../event/EventWindow';
import MessagesWindow from '../message/MessagesWindow';
import WorkspaceSplitter from './WorkspaceSplitter';
import {
	useActivePanel,
	useMessagesStore,
	useWorkspaceEventStore,
	useWorkspaceStore,
} from '../../hooks';
import {
	isEventsStore,
	isMessagesStore,
	isSearchStore,
	isBookmarksStore,
} from '../../helpers/stores';
import { useWorkspaceViewStore } from '../../hooks/useWorkspaceViewStore';
import '../../styles/workspace.scss';

const panelColors = {
	events: {
		default: '#F5C5A3',
		active: '#F7A76E',
	},
	search: {
		default: '#5C85D6',
		active: '#5C85D6',
	},
	messages: {
		default: '#ADE0EB',
		active: '#1AC4E5',
	},
	bookmarks: {
		default: '#CCA3F5',
		active: '#CCA3F5',
	},
} as const;

function Workspace() {
	const { activePanel } = useActivePanel(null);
	const { panelsLayout, setPanelsLayout, togglePanel } = useWorkspaceViewStore();
	const workspaceStore = useWorkspaceStore();
	const messagesStore = useMessagesStore();
	const eventsStore = useWorkspaceEventStore();

	const itemsInView = computed(() =>
		[...messagesStore.messagesInView, ...eventsStore.eventsInView].reduce(
			(map, item) => ({
				...map,
				[getItemId(item)]: true,
			}),
			{} as Record<string, boolean>,
		),
	).get();

	return (
		<div className='workspace'>
			<WorkspaceSplitter
				panelsLayout={panelsLayout}
				setPanelsLayout={setPanelsLayout}
				togglePanel={togglePanel}
				panels={[
					{
						title: 'Smart Search',
						color: panelColors.search,
						component: (
							<SearchPanel
								onResultClick={workspaceStore.onSearchResultItemSelect}
								onResultGroupClick={workspaceStore.onSearchResultGroupSelect}
								itemsInView={itemsInView}
							/>
						),
						isActive: isSearchStore(activePanel),
					},
					{
						title: 'Events',
						color: panelColors.events,
						component: <EventWindow />,
						isActive: isEventsStore(activePanel),
						setActivePanel: () =>
							workspaceStore.viewStore.setActivePanel(workspaceStore.eventsStore),
					},
					{
						title: 'Messages',
						color: panelColors.messages,
						component: <MessagesWindow />,
						isActive: isMessagesStore(activePanel),
						setActivePanel: () =>
							workspaceStore.viewStore.setActivePanel(workspaceStore.messagesStore),
					},
					{
						title: 'Bookmarks',
						color: panelColors.bookmarks,
						component: <BookmarksPanel />,
						isActive: isBookmarksStore(activePanel),
					},
				]}
			/>
		</div>
	);
}

export default observer(Workspace);
