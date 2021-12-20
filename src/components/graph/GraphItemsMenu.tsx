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
import moment from 'moment';
import { getTimestampAsNumber } from '../../helpers/date';
import { getGraphItemId } from '../../helpers/graph';
import { createStyleSelector } from '../../helpers/styleCreators';
import { GraphItem } from '../../models/Graph';
import { isEvent } from '../../helpers/event';
import { GraphStore } from '../../stores/GraphStore';
import Popover from '../util/Popover';
import { isBookmark } from '../bookmarks/BookmarksPanel';

interface MenuProps {
	items: GraphItem[];
	onClose: () => void;
	isMenuOpened: boolean;
	anchorEl?: HTMLElement | null;
	onMenuItemClick: (item: GraphItem) => void;
	getGraphItemType: InstanceType<typeof GraphStore>['getGraphItemType'];
	maxWidth?: number;
}

export default function GraphItemsMenu({
	items,
	onClose,
	isMenuOpened,
	anchorEl,
	onMenuItemClick,
	getGraphItemType,
}: MenuProps) {
	const onClickOutside = React.useCallback(
		e => {
			if (isMenuOpened && e.target instanceof Node && !anchorEl?.contains(e.target)) {
				onClose();
			}
		},
		[isMenuOpened, anchorEl],
	);

	function handleClick(e: React.MouseEvent<HTMLLIElement>, item: GraphItem) {
		e.stopPropagation();
		onMenuItemClick(item);
		onClose();
	}

	const menuClassName = createStyleSelector('graph-menu', isMenuOpened ? 'active' : null);

	const getItemTitle = (graphItem: GraphItem): string => {
		if (isBookmark(graphItem)) {
			return getItemTitle(graphItem.item);
		}
		if (isEvent(graphItem)) return graphItem.eventName;
		return graphItem.messageId;
	};

	return (
		<Popover
			isOpen={isMenuOpened}
			anchorEl={anchorEl}
			onClickOutside={onClickOutside}
			className={menuClassName}>
			<ul className='graph-item-group__list'>
				{items.map(item => (
					<li
						key={getGraphItemId(item)}
						className='graph-menu__item'
						onClick={ev => handleClick(ev, item)}>
						<div
							className={createStyleSelector(
								'graph-menu__item-icon',
								`${getGraphItemType(item)}-icon`,
							)}
						/>
						<div className='graph-menu__item-name'>{getItemTitle(item)}</div>
						<div className='graph-menu__item-timestamp'>
							{moment(getTimestampAsNumber(item)).utc().format('DD.MM.YYYY HH:mm:ss:SSS')}
						</div>
					</li>
				))}
			</ul>
		</Popover>
	);
}
