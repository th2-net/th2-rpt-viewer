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

import React, { memo } from 'react';
import { formatTimestamp, getTimestampAsNumber } from 'helpers/date';
import { isEventMessage } from 'helpers/message';
import { createBemElement, createStyleSelector } from 'helpers/styleCreators';
import { Bookmark } from '../models/Bookmarks';

interface BookmarkItemProps {
	bookmark: Bookmark;
	onRemove?: (item: Bookmark) => void;
	onClick?: (item: Bookmark) => void;
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

	const item = bookmark.item;

	const itemInfo = {
		id: isEventMessage(item) ? item.id : item.eventId,
		status: isEventMessage(item) ? null : item.successful ? 'passed' : 'failed',
		title: isEventMessage(item) ? item.type || 'unknown type' : item.eventName,
		timestamp: getTimestampAsNumber(item),
		type: item.type,
	};

	function onBookmarkRemove(event: React.MouseEvent<HTMLButtonElement>) {
		if (onRemove) {
			event.stopPropagation();
			onRemove(bookmark);
		}
	}

	function onBookmarkAdd(e: React.MouseEvent<HTMLDivElement>) {
		if (toggleBookmark) {
			e.stopPropagation();
			toggleBookmark();
		}
	}

	function onBookmarkClick() {
		if (onClick) {
			onClick(bookmark);
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
					<p className='bookmark-item__title' title={itemInfo.title} onClick={onBookmarkClick}>
						{itemInfo.title}
					</p>
				</div>
				<div className='bookmark-item__timestamp'>{formatTimestamp(itemInfo.timestamp)}</div>
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
							onClick={onBookmarkAdd}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export const BookmarkItem = memo(BookmarkItemBase);
