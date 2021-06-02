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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import moment from 'moment';
import { Virtuoso } from 'react-virtuoso';
import Empty from '../util/Empty';
import { getTimestampAsNumber } from '../../helpers/date';
import { getItemId, getItemName, isEvent, isEventMessage } from '../../helpers/event';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { useActivePanel, useSelectedStore } from '../../hooks';
import { EventAction, EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import useSearchWorkspace from '../../hooks/useSearchWorkspace';
import BookmarkTextSearch from './BookmarkTextSearch';
import BookmarkTypeSwitcher from './BookmarkTypeSwitcher';
import Checkbox from '../util/Checkbox';
import '../../styles/bookmarks.scss';

export type Bookmark = EventBookmark | MessageBookmark;

export type BookmarkedItem = Bookmark | EventMessage | EventTreeNode | EventAction;

export type BookmarkType = 'event' | 'message';

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

	const [bookmarkType, setBookmarkType] = React.useState<BookmarkType | null>(null);
	const [textSearch, setTextSearch] = React.useState('');
	const [selectedBookmarks, setSelectedBookmarks] = React.useState<string[]>([]);

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

	const filteredBookmarks = React.useMemo(() => {
		return bookmarks
			.filter(
				bookmark =>
					bookmarkType === null ||
					(bookmarkType === 'event' && isEventBookmark(bookmark)) ||
					(bookmarkType === 'message' && isMessageBookmark(bookmark)),
			)
			.filter(
				bookmark =>
					getItemId(bookmark.item).includes(textSearch) ||
					getItemName(bookmark.item).includes(textSearch),
			);
	}, [bookmarks, bookmarkType, textSearch]);

	const { ref: panelRef } = useActivePanel(null);

	function onBookmarkClick(bookmark: BookmarkedItem) {
		if (isBookmark(bookmark)) {
			searchWorkspace.onSavedItemSelect(bookmark.item);
		} else {
			searchWorkspace.onSavedItemSelect(bookmark);
		}
	}

	function computeKey(index: number) {
		return filteredBookmarks[index].id;
	}

	function selectItem(index: number) {
		if (!selectedBookmarks.includes(filteredBookmarks[index].id)) {
			setSelectedBookmarks([...selectedBookmarks, filteredBookmarks[index].id]);
		} else {
			setSelectedBookmarks(selectedBookmarks.filter(item => filteredBookmarks[index].id !== item));
		}
	}

	function selectAll() {
		if (selectedBookmarks.length !== filteredBookmarks.length) {
			setSelectedBookmarks(filteredBookmarks.map(bookmark => bookmark.id));
		} else {
			setSelectedBookmarks([]);
		}
	}

	function removeSelected() {
		filteredBookmarks
			.filter(bookmark => selectedBookmarks.includes(bookmark.id))
			.forEach(bookmark => selectedStore.removeBookmark(bookmark));
		setSelectedBookmarks([]);
	}

	function renderBookmarkItem(index: number) {
		return (
			<div className='bookmarks-panel-item'>
				<div className='bookmarks-panel-item__content'>
					<BookmarkItem
						bookmark={filteredBookmarks[index]}
						onClick={onBookmarkClick}
						isBookmarkButtonDisabled={selectedStore.isBookmarksFull}
					/>
				</div>
				<Checkbox
					className='bookmarks-panel-checkbox'
					checked={selectedBookmarks.includes(filteredBookmarks[index].id)}
					onChange={() => selectItem(index)}
				/>
			</div>
		);
	}

	const iconButtonClassName = createBemElement('button', 'icon');

	return (
		<div className='bookmarks-panel' ref={panelRef}>
			<div className='bookmark-panel-header'>
				<BookmarkTypeSwitcher value={bookmarkType} setValue={setBookmarkType} label='Type' />
				<BookmarkTextSearch value={textSearch} setValue={setTextSearch} label='Search' />
				<div className='bookmark-panel-header-actions'>
					<div className='bookmark-panel-header-actions_left-side'>
						<button
							className='button'
							disabled={selectedBookmarks.length === 0}
							onClick={removeSelected}>
							<i className={iconButtonClassName} />
							<span className='button__label'>
								Delete {selectedBookmarks.length > 0 && `(${selectedBookmarks.length})`}
							</span>
						</button>
					</div>
					<div className='bookmark-panel-header-actions_right-side'>
						<Checkbox
							className='bookmarks-panel-checkbox'
							checked={selectedBookmarks.length === filteredBookmarks.length}
							onChange={selectAll}
						/>
					</div>
				</div>
			</div>
			<div className='bookmarks-panel__container'>
				{bookmarks.length === 0 && <Empty description='No bookmarks added' />}
				<Virtuoso
					className='bookmarks-panel__list'
					totalCount={filteredBookmarks.length}
					itemContent={renderBookmarkItem}
					computeItemKey={computeKey}
					style={{ height: '100%' }}
				/>
			</div>
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
		title: isEventMessage(item) ? item.messageType || 'unknown type' : item.eventName,
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
