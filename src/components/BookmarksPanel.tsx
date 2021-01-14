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

import React from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { Virtuoso } from 'react-virtuoso';
import { getTimestampAsNumber } from '../helpers/date';
import { isEventAction } from '../helpers/event';
import { createStyleSelector } from '../helpers/styleCreators';
import { useSelectedStore } from '../hooks';
import { useWorkspaceViewStore } from '../hooks/useWorkspaceViewStore';
import { EventAction } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import '../styles/bookmarks.scss';

type SavedItem = EventMessage | EventAction;

const BookmarksPanel = () => {
	const selectedStore = useSelectedStore();
	const viewStore = useWorkspaceViewStore();

	const onRemoveSavedItem = (item: SavedItem) => selectedStore.removeSavedItem(item);

	// TODO: implement select of bookmarked item
	const onItemClick = (item: SavedItem) => console.log(item);

	const computeKey = (index: number) => {
		const item = selectedStore.savedItems[index];

		return isEventAction(item) ? item.eventId : item.messageId;
	};

	const renderBookmarkItem = (index: number) => {
		const item = selectedStore.savedItems[index];
		return <BookmarkItem item={item} onRemove={onRemoveSavedItem} onClick={onItemClick} />;
	};

	return (
		<div className='bookmarks-panel' onClick={() => viewStore.setTargetPanel(null)}>
			<Virtuoso
				className='bookmarks-panel__list'
				totalCount={selectedStore.savedItems.length}
				item={renderBookmarkItem}
				computeItemKey={computeKey}
				style={{ height: '100%' }}
			/>
		</div>
	);
};

export default observer(BookmarksPanel);

interface BookmarkItemProps {
	item: SavedItem;
	onRemove: (item: SavedItem) => void;
	onClick: (item: SavedItem) => void;
}

const BookmarkItem = ({ item, onRemove, onClick }: BookmarkItemProps) => {
	const itemInfo = {
		status: isEventAction(item) ? (item.successful ? 'passed' : 'failed') : null,
		title: isEventAction(item) ? item.eventName : item.messageId,
		timestamp: getTimestampAsNumber(isEventAction(item) ? item.startTimestamp : item.timestamp),
	};

	return (
		<div
			onClick={() => onClick(item)}
			className={createStyleSelector('bookmark-item', item.type, itemInfo.status)}>
			<i
				className={createStyleSelector('bookmark-item__icon', `${item.type}-icon`, itemInfo.status)}
			/>
			<div className='bookmark-item__info'>
				<div className='bookmark-item__name' title={itemInfo.title}>
					{itemInfo.title}
				</div>
				<div className='bookmark-item__timestamp'>
					{moment(itemInfo.timestamp).utc().format('DD.MM.YYYY HH:mm:ss:SSS')}
				</div>
			</div>
			<button
				className='bookmark-item__remove-btn'
				onClick={e => {
					e.stopPropagation();
					onRemove(item);
				}}>
				<i className='bookmark-item__remove-btn-icon' />
			</button>
		</div>
	);
};
