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
import EventsPanel from 'modules/events';
import SearchPanel from 'modules/search';
import { getItemId } from 'helpers/event';
import { Panel } from 'models/Panel';
import MessagesPanel from 'modules/messages';
import { BookmarkIcon } from 'components/icons/BookmarkIcon';
import { StatusIcon } from 'components/icons/StatusIcon';
import { MessageIcon } from 'components/icons/MessageIcon';
import { SearchIcon } from 'components/icons/SearchIcon';
import WorkspaceSplitter from './WorkspaceSplitter';
import BookmarkCounter from '../../modules/bookmarks/components/BookmarkCounter';
import { useActivePanel, useWorkspaceStore } from '../../hooks';
import { useWorkspaceViewStore } from '../../hooks/useWorkspaceViewStore';
import '../../styles/workspace.scss';

// TODO: These colors seem to be redundant. recheck later
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
	const { activePanel } = useActivePanel();
	const { panelsLayout, setPanelsLayout, togglePanel } = useWorkspaceViewStore();
	const workspaceStore = useWorkspaceStore();

	const itemsInView = computed(() =>
		[
			...workspaceStore.messagesStore.messagesInView,
			...workspaceStore.eventsStore.renderedEvents,
		].reduce(
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
						header: (
							<div className='search-panel-header'>
								<SearchIcon />
								<h2>Smart Search</h2>
							</div>
						),
						component: (
							<SearchPanel
								onResultClick={workspaceStore.onSearchResultItemSelect}
								itemsInView={itemsInView}
							/>
						),
						panel: Panel.Search,
						isActive: activePanel === Panel.Search,
						setActivePanel: workspaceStore.viewStore.setActivePanel,
					},
					{
						title: 'Events',
						color: panelColors.events,
						header: (
							<div className='events-panel-header'>
								<StatusIcon /> <h2>Events</h2>
							</div>
						),
						component: <EventsPanel />,
						isActive: activePanel === Panel.Events,
						panel: Panel.Events,
						setActivePanel: workspaceStore.viewStore.setActivePanel,
					},
					{
						title: 'Messages',
						color: panelColors.messages,
						header: (
							<div className='messages-panel-header'>
								<MessageIcon /> <h2>Messages</h2>
							</div>
						),
						component: <MessagesPanel />,
						isActive: activePanel === Panel.Messages,
						panel: Panel.Messages,
						setActivePanel: workspaceStore.viewStore.setActivePanel,
					},
					{
						title: 'Bookmarks',
						color: panelColors.bookmarks,
						header: (
							<div className='bookmarks-panel-header'>
								<BookmarkIcon isPinned={false} />
								<h2>Bookmarks</h2>
								<BookmarkCounter />
							</div>
						),
						component: <BookmarksPanel onBookmarkClick={workspaceStore.onSavedItemSelect} />,
						isActive: activePanel === Panel.Bookmarks,
						panel: Panel.Bookmarks,
						setActivePanel: workspaceStore.viewStore.setActivePanel,
					},
				]}
			/>
		</div>
	);
}

export default observer(Workspace);
