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

import { useCallback, useState } from 'react';
import { Observer, observer, useLocalStore } from 'mobx-react-lite';
import MessagesViewTypeStore from 'modules/messages/stores/MessagesViewTypeStore';
import MessageCard from 'modules/messages/components/message-card/MessageCard';
import { ExpandableEventCard } from 'modules/events/components/event-card/ExpandableEventCard';
import { useActivePanel } from 'hooks/index';
import { EventTreeNode, EventAction } from 'models/EventAction';
import { EventMessage } from 'models/EventMessage';
import { Panel } from 'models/Panel';
import { isEventAction } from 'helpers/event';
import EventCardHeader from 'modules/events/components/event-card/EventCardHeader';
import { useBookmarksFilterStore } from '../hooks/useBookmarkFilterStore';
import { useBookmarksStore } from '../hooks/useBookmarksStore';
import { BookmarkFilters } from './BookmarkFilters';
import { BookmarkList } from './BookmarkList';
import { Bookmark } from '../models/Bookmarks';
import { isEventBookmark, isMessageBookmark } from '../helpers/bookmarks';
import 'styles/bookmarks.scss';

interface BookmarkPanelProps {
	onBookmarkClick: (savedItem: EventAction | EventMessage | EventTreeNode) => void;
}

function BookmarksPanel(props: BookmarkPanelProps) {
	const { isEmpty } = useBookmarksStore();

	const filterStore = useBookmarksFilterStore();

	const { ref: panelRef } = useActivePanel(Panel.Bookmarks);

	const isExpandedStore = useLocalStore(() => ({
		map: new Map(),
		toggleExpand: (id: string) => {
			const isExpanded = isExpandedStore.map.get(id);
			isExpandedStore.map.set(id, !isExpanded);
		},
		clear: () => {
			isExpandedStore.map.clear();
		},
	}));

	const [viewTypesStore] = useState(() => new MessagesViewTypeStore());

	const onEventClick = useCallback(
		(event: EventAction) => {
			props.onBookmarkClick(event);
		},
		[props.onBookmarkClick],
	);

	const onMessageClick = useCallback(
		(event: EventMessage) => {
			props.onBookmarkClick(event);
		},
		[props.onBookmarkClick],
	);

	function renderBookmarkItem(index: number, bookmark: Bookmark) {
		const togglerSelect = () => filterStore.selectItem(bookmark);
		if (isMessageBookmark(bookmark)) {
			const message = bookmark.item;
			const viewTypeStore = viewTypesStore.getSavedViewType(message);
			return (
				<Observer>
					{() => (
						<div className='bookmarks-panel__list-item'>
							<MessageCard
								message={message}
								isExpanded={Boolean(isExpandedStore.map.get(message.id))}
								setIsExpanded={() => isExpandedStore.toggleExpand(message.id)}
								viewTypesMap={viewTypeStore.viewTypes}
								setViewType={viewTypeStore.setViewType}
								showCheckbox={true}
								checked={filterStore.selectedBookmarks.has(bookmark.id)}
								onSelect={togglerSelect}
								onIdClick={onMessageClick}
							/>
						</div>
					)}
				</Observer>
			);
		}
		if (isEventBookmark(bookmark)) {
			const event = bookmark.item;
			if (isEventAction(event)) {
				return (
					<Observer>
						{() => (
							<div className='bookmarks-panel__list-item'>
								<ExpandableEventCard
									event={bookmark.item as unknown as EventAction}
									onClick={onEventClick}
									isExpanded={Boolean(isExpandedStore.map.get(bookmark.item.eventId))}
									toggleExpand={isExpandedStore.toggleExpand}
									showCheckbox={true}
									checked={filterStore.selectedBookmarks.has(bookmark.id)}
									onSelect={togglerSelect}
								/>
							</div>
						)}
					</Observer>
				);
			}

			const node = event as EventTreeNode;
			const onClick = () => props.onBookmarkClick(event);
			return (
				<Observer>
					{() => (
						<div className='bookmarks-panel__list-item'>
							<EventCardHeader
								event={node}
								showCheckbox={true}
								checked={filterStore.selectedBookmarks.has(bookmark.id)}
								onSelect={togglerSelect}
								onNameClick={onClick}
							/>
						</div>
					)}
				</Observer>
			);
		}

		return null;
	}

	return (
		<div className='window bookmarks-panel' ref={panelRef}>
			<BookmarkFilters />
			<BookmarkList
				isEmpty={isEmpty}
				renderBookmark={renderBookmarkItem}
				bookmarks={filterStore.filteredBookmarks}
			/>
		</div>
	);
}

export default observer(BookmarksPanel);
