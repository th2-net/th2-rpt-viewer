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

import { observer } from 'mobx-react-lite';
import moment from 'moment';
import React from 'react';
import { getTimestampAsNumber } from '../helpers/date';
import { isEventAction, isEventMessage } from '../helpers/event';
import { createBemElement, createStyleSelector } from '../helpers/styleCreators';
import { useSelectedStore } from '../hooks';
import { useWorkspaceViewStore } from '../hooks/useWorkspaceViewStore';
import { EventAction } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import '../styles/bookmarks.scss';

interface SavedItem {
	value: EventMessage | EventAction;
	type: SavedItemTypes;
}

enum SavedItemTypes {
	PINNED_MESSAGE = 'pinned-message',
	EVENT = 'event',
}

const BookmarksPanel = () => {
	const selectedStore = useSelectedStore();
	const viewStore = useWorkspaceViewStore();

	const savedItems: SavedItem[] = React.useMemo(() => {
		return [...selectedStore.pinnedMessages, ...selectedStore.pinnedEvents]
			.map(item => ({
				value: item,
				type: isEventMessage(item) ? SavedItemTypes.PINNED_MESSAGE : SavedItemTypes.EVENT,
			}))
			.sort((firstItem, secondItem) => {
				const getItemTimestamp = (item: SavedItem) =>
					getTimestampAsNumber(
						isEventAction(item.value) ? item.value.startTimestamp : item.value.timestamp,
					);
				const firstTimestamp = getItemTimestamp(firstItem);
				const secondTimestamp = getItemTimestamp(secondItem);

				return firstTimestamp >= secondTimestamp ? 1 : -1;
			});
	}, [selectedStore.pinnedMessages, selectedStore.pinnedEvents]);

	const removeSavedItem = (item: SavedItem) => selectedStore.removeSavedItem(item.value);

	return (
		<div onClick={() => viewStore.setTargetPanel(null)} className='bookmarks-panel'>
			<div className='bookmarks-panel__list'>
				{savedItems.map(item => (
					<BookmarkItem
						item={item}
						onRemove={removeSavedItem}
						key={isEventAction(item.value) ? item.value.eventId : item.value.messageId}
					/>
				))}
			</div>
		</div>
	);
};

export default observer(BookmarksPanel);

interface BookmarkItemProps {
	item: SavedItem;
	onRemove: (item: SavedItem) => void;
}

const BookmarkItem = ({ item, onRemove }: BookmarkItemProps) => (
	<div
		key={isEventAction(item.value) ? item.value.eventId : item.value.messageId}
		className={createStyleSelector(
			'bookmark-item',
			item.type,
			isEventAction(item.value) ? (item.value.successful ? 'passed' : 'failed') : null,
		)}>
		<i
			className={createStyleSelector(
				'bookmark-item__icon',
				`${item.type}-icon`,
				isEventAction(item.value) ? (item.value.successful ? 'passed' : 'failed') : null,
			)}
		/>
		<div className='bookmark-item__info'>
			<div
				className='bookmark-item__name'
				title={isEventAction(item.value) ? item.value.eventName : item.value.messageId}>
				{isEventAction(item.value) ? item.value.eventName : item.value.messageId}
			</div>
			<div className='bookmark-item__timestamp'>
				{moment(
					getTimestampAsNumber(
						isEventAction(item.value) ? item.value.startTimestamp : item.value.timestamp,
					),
				)
					.utc()
					.format('DD.MM.YYYY HH:mm:ss:SSS')}
			</div>
		</div>
		<button onClick={() => onRemove(item)} className='bookmark-item__remove-btn'>
			<i className='bookmark-item__remove-btn-icon' />
		</button>
	</div>
);
