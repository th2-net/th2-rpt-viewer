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
import { createBemElement } from '../helpers/styleCreators';
import { useSelectedStore } from '../hooks';
import { EventAction } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';

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

	const removeSavedItem = (item: SavedItem) => {
		if (isEventAction(item.value)) {
			selectedStore.removePinnedEvent(item.value);
		} else {
			selectedStore.removePinnedMessage(item.value);
		}
	};

	return (
		<div className='bookmarks-panel'>
			{savedItems.map(item => {
				const itemClass = createBemElement(
					'bookmarks-panel',
					'item',
					item.type,
					isEventAction(item.value) ? (item.value.successful ? 'passed' : 'failed') : null,
				);
				const itemIconClass = createBemElement(
					'bookmarks-panel',
					'item-icon',
					`${item.type}-icon`,
					isEventAction(item.value) ? (item.value.successful ? 'passed' : 'failed') : null,
				);
				return (
					<div
						key={isEventAction(item.value) ? item.value.eventId : item.value.messageId}
						className={itemClass}>
						<i className={itemIconClass} />
						<div className='bookmarks-panel__item-info'>
							<div className='bookmarks-panel__item-name'>
								{isEventAction(item.value) ? item.value.eventName : item.value.messageId}
							</div>
							<div className='bookmarks-panel__item-timestamp'>
								{moment(
									getTimestampAsNumber(
										isEventAction(item.value) ? item.value.startTimestamp : item.value.timestamp,
									),
								).format('DD.MM.YYYY HH:mm:ss:SSS')}
							</div>
						</div>
						<button
							onClick={() => removeSavedItem(item)}
							className='bookmarks-panel__item-remove-btn'>
							<i className='bookmarks-panel__item-remove-btn-icon' />
						</button>
					</div>
				);
			})}
		</div>
	);
};

export default observer(BookmarksPanel);
