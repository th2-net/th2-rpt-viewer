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
import { isEvent, isEventMessage } from '../helpers/event';
import { createBemElement, createStyleSelector } from '../helpers/styleCreators';
import { useActivePanel, useSelectedStore } from '../hooks';
import { EventAction, EventTreeNode } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import useSearchWorkspace from '../hooks/useSearchWorkspace';
import '../styles/bookmarks.scss';

export type Bookmark = EventBookmark | MessageBookmark;

export type BookmarkedItem = Bookmark | EventMessage | EventTreeNode | EventAction;

export function isBookmark(item: unknown): item is Bookmark {
	return (item as Bookmark).id !== undefined && (item as Bookmark).item !== undefined;
}

export interface MessageBookmark {
	timestamp: number;
	id: string;
	item: EventMessage;
}

export interface EventBookmark {
	timestamp: number;
	id: string;
	item: EventMessage | EventTreeNode;
}

export function isEventBookmark(bookmark: unknown): bookmark is EventBookmark {
	return isBookmark(bookmark) && isEvent(bookmark.item);
}

export function isMessageBookmark(bookmark: unknown): bookmark is MessageBookmark {
	return isBookmark(bookmark) && isEventMessage(bookmark.item);
}

function BookmarksPanel() {
	const selectedStore = useSelectedStore();
	const searchWorkspace = useSearchWorkspace();

	const bookmarks = React.useMemo(() => {
		const sortedBookmarks: Bookmark[] = [
			...selectedStore.bookmarkedMessages,
			...selectedStore.bookmarkedEvents,
		];

		sortedBookmarks.sort((bookmarkA, bookmarkB) => {
			if (bookmarkA.timestamp > bookmarkB.timestamp) return -1;
			if (bookmarkA.timestamp < bookmarkB.timestamp) return 1;
			return 0;
		});
		return sortedBookmarks;
	}, [selectedStore.bookmarkedMessages, selectedStore.bookmarkedEvents]);

	const { ref: panelRef } = useActivePanel(null);

	function onBookmarkRemove(bookmark: BookmarkedItem) {
		if (isBookmark(bookmark)) {
			selectedStore.removeBookmark(bookmark);
		}
	}

	function onBookmarkClick(bookmark: BookmarkedItem) {
		if (isBookmark(bookmark)) {
			searchWorkspace.onSavedItemSelect(bookmark.item);
		} else {
			searchWorkspace.onSavedItemSelect(bookmark);
		}
	}

	function computeKey(index: number) {
		return bookmarks[index].id;
	}

	function renderBookmarkItem(index: number) {
		return (
			<BookmarkItem
				bookmark={bookmarks[index]}
				onRemove={onBookmarkRemove}
				onClick={onBookmarkClick}
				isBookmarkButtonDisabled={selectedStore.isBookmarksFull}
			/>
		);
	}

	return (
		<div className='bookmarks-panel' ref={panelRef}>
			{bookmarks.length === 0 && <Empty description='No bookmarks added' />}
			<Virtuoso
				className='bookmarks-panel__list'
				totalCount={bookmarks.length}
				itemContent={renderBookmarkItem}
				computeItemKey={computeKey}
				style={{ height: '100%' }}
			/>
		</div>
	);
}

export default observer(BookmarksPanel);

interface BookmarkItemProps {
	bookmark: BookmarkedItem;
	onRemove?: (item: BookmarkedItem) => void;
	onClick?: (item: BookmarkedItem) => void;
	toggleBookmark?: () => void;
	isBookmarked?: boolean;
	isBookmarkButtonDisabled: boolean;
}

const BookmarkItemBase = (props: BookmarkItemProps) => {
	const {
		bookmark,
		onRemove,
		onClick,
		toggleBookmark,
		isBookmarked = true,
		isBookmarkButtonDisabled,
	} = props;

	const item: EventMessage | EventTreeNode | EventAction = isBookmark(bookmark)
		? bookmark.item
		: bookmark;

	const itemInfo = {
		id: isEventMessage(item) ? item.messageId : item.eventId,
		status: isEventMessage(item) ? null : item.successful ? 'passed' : 'failed',
		title: isEventMessage(item) ? item.messageType : item.eventName,
		timestamp: getTimestampAsNumber(item),
		type: item.type,
	};

	function onBookmarkRemove(event: React.MouseEvent<HTMLButtonElement>) {
		if (onRemove) {
			event.stopPropagation();
			onRemove(bookmark);
		}
	}

	const rootClassName = createStyleSelector('bookmark-item', itemInfo.type, itemInfo.status);

	const iconClassName = createStyleSelector(
		'bookmark-item__icon',
		`${itemInfo.type}-icon`,
		itemInfo.status,
	);

	const bookmarkButtonClassname = createBemElement(
		'bookmark-item',
		'toggle-btn',
		isBookmarkButtonDisabled ? 'disabled' : null,
	);

	return (
		<div className={rootClassName}>
			<i className={iconClassName} />
			<div className='bookmark-item__info'>
				<div className='bookmark-item__name'>
					<p
						className='bookmark-item__title'
						title={itemInfo.title}
						onClick={() => onClick && onClick(item)}>
						{itemInfo.title}
					</p>
				</div>
				<div className='bookmark-item__timestamp'>
					{moment(itemInfo.timestamp).utc().format('DD.MM.YYYY HH:mm:ss.SSS')}
				</div>
				<div className='bookmark-item__id'>{itemInfo.id}</div>
			</div>
			<div className='bookmark-item__buttons'>
				{onRemove && (
					<button className='bookmark-item__remove-btn' onClick={onBookmarkRemove}>
						<i className='bookmark-item__remove-btn-icon' />
					</button>
				)}
				{!onRemove && toggleBookmark && (
					<div className={bookmarkButtonClassname}>
						<div
							title={
								isBookmarkButtonDisabled
									? 'Maximum bookmarks limit reached. Delete old bookmarks'
									: undefined
							}
							className={createStyleSelector('bookmark-button', isBookmarked ? 'pinned' : null)}
							onClick={e => {
								e.stopPropagation();
								toggleBookmark();
							}}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export const BookmarkItem = React.memo(BookmarkItemBase);
