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
import Empty from './util/Empty';
import { getTimestampAsNumber } from '../helpers/date';
import { isEventMessage, isEventNode } from '../helpers/event';
import { createStyleSelector } from '../helpers/styleCreators';
import { useActivePanel, useSelectedStore, useWorkspaceStore } from '../hooks';
import { EventAction, EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import '../styles/bookmarks.scss';

export type BookmarkedItem = EventMessage | EventTreeNode | EventAction;

function BookmarksPanel() {
	const selectedStore = useSelectedStore();
	const workspaceStore = useWorkspaceStore();

	const { ref: panelRef } = useActivePanel(null);

	function onBookmarkRemove(item: BookmarkedItem) {
		if (isEventNode(item) || isEventMessage(item)) {
			return selectedStore.removeSavedItem(item);
		}
		return null;
	}

	function onBookmarkClick(item: BookmarkedItem) {
		return workspaceStore.onSavedItemSelect(item);
	}

	function computeKey(index: number) {
		const item = selectedStore.savedItems[index];

		return isEventNode(item) ? item.eventId : item.messageId;
	}

	function renderBookmarkItem(index: number) {
		return (
			<BookmarkItem
				item={selectedStore.savedItems[index]}
				onRemove={onBookmarkRemove}
				onClick={onBookmarkClick}
			/>
		);
	}

	return (
		<div className='bookmarks-panel' ref={panelRef}>
			{selectedStore.savedItems.length === 0 && <Empty description='No bookmarks added' />}
			<Virtuoso
				className='bookmarks-panel__list'
				totalCount={selectedStore.savedItems.length}
				item={renderBookmarkItem}
				computeItemKey={computeKey}
				style={{ height: '100%' }}
			/>
		</div>
	);
}

export default observer(BookmarksPanel);

interface BookmarkItemProps {
	item: BookmarkedItem;
	onRemove?: (item: BookmarkedItem) => void;
	onClick?: (item: BookmarkedItem) => void;
}

const BookmarkItemBase = ({ item, onRemove, onClick }: BookmarkItemProps) => {
	const itemInfo = {
		id: isEventMessage(item) ? item.messageId : item.eventId,
		status: isEventMessage(item) ? null : item.successful ? 'passed' : 'failed',
		title: isEventMessage(item) ? item.messageId : item.eventName,
		timestamp: getTimestampAsNumber(isEventMessage(item) ? item.timestamp : item.startTimestamp),
		type: isEventMessage(item) ? 'message' : item.type,
	};

	function onBookmarkRemove(event: React.MouseEvent<HTMLButtonElement>) {
		if (onRemove) {
			event.stopPropagation();
			onRemove(item);
		}
	}

	const rootClassName = createStyleSelector('bookmark-item', itemInfo.type, itemInfo.status);

	const iconClassName = createStyleSelector(
		'bookmark-item__icon',
		`${itemInfo.type}-icon`,
		itemInfo.status,
	);

	return (
		<div onClick={() => onClick && onClick(item)} className={rootClassName}>
			<i className={iconClassName} />
			<div className='bookmark-item__info'>
				<div className='bookmark-item__name' title={itemInfo.title}>
					{itemInfo.title}
				</div>
				<div className='bookmark-item__timestamp'>
					{moment(itemInfo.timestamp).utc().format('DD.MM.YYYY HH:mm:ss.SSS')}
				</div>
				<div className='bookmark-item__id'>{itemInfo.id}</div>
			</div>
			{onRemove && (
				<button className='bookmark-item__remove-btn' onClick={onBookmarkRemove}>
					<i className='bookmark-item__remove-btn-icon' />
				</button>
			)}
		</div>
	);
};

export const BookmarkItem = React.memo(BookmarkItemBase);
