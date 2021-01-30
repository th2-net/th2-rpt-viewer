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

import moment from 'moment';
import React from 'react';
import { ModalPortal } from '../util/Portal';
import { getTimestampAsNumber } from '../../helpers/date';
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import { useOutsideClickListener } from '../../hooks';
import { EventTreeNode } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { AttachedItem, AttachedItemGroup } from '../../models/Graph';
import { getEventStatus, isEventMessage, isEventNode } from '../../helpers/event';

interface GraphAttachedItemGroupProps {
	group: AttachedItemGroup;
	onGraphItemClick: (item: EventTreeNode | EventMessage) => void;
}

function GraphAttachedItemGroup(props: GraphAttachedItemGroupProps) {
	const { group, onGraphItemClick } = props;

	const groupRef = React.useRef<HTMLDivElement>(null);
	const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);

	function handleClick() {
		setMenuAnchor(groupRef.current);
	}

	return (
		<div className='graph-item-group' ref={groupRef} style={{ left: group.left }}>
			<div className='graph-item-group__dots'>
				{group.items.slice(0, 3).map(item => (
					<GraphDot
						key={isEventMessage(item.value) ? item.value.messageId : item.value.eventId}
						item={item}
						openMenu={handleClick}
						className={
							group.items.length === 1 && group.items[0].type === 'pinned-message'
								? 'graph-dot__pinned-message full'
								: undefined
						}
					/>
				))}
			</div>
			<GraphItemMenu
				onMenuItemClick={onGraphItemClick}
				items={group.items}
				isMenuOpened={Boolean(menuAnchor)}
				onClose={() => setMenuAnchor(null)}
				anchorEl={menuAnchor}
			/>
		</div>
	);
}

export default GraphAttachedItemGroup;

interface GraphAttachedItemProps {
	item: AttachedItem;
	className?: string;
	openMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function GraphDot({ item, className, openMenu }: GraphAttachedItemProps) {
	const itemClass = createBemElement(
		'graph-dot',
		item.type,
		isEventNode(item.value) ? getEventStatus(item.value) : null,
	);

	return <div className={className || itemClass} onClick={openMenu} />;
}

interface MenuProps {
	items: AttachedItem[];
	onClose: () => void;
	isMenuOpened: boolean;
	anchorEl?: HTMLElement | null;
	onMenuItemClick: (item: EventTreeNode | EventMessage) => void;
}

export function GraphItemMenu({
	items,
	onClose,
	isMenuOpened,
	anchorEl,
	onMenuItemClick,
}: MenuProps) {
	const menuRef = React.useRef<HTMLDivElement>(null);

	const anchorElement = anchorEl || menuRef.current;

	useOutsideClickListener(menuRef, () => {
		if (isMenuOpened) {
			onClose();
		}
	});

	const getAnchorOffset = React.useCallback(() => {
		if (anchorElement instanceof HTMLElement && menuRef.current) {
			const anchorRect = anchorElement.getBoundingClientRect();
			let menuOffsetLeft = anchorRect.right + 10;
			const { width } = menuRef.current.getBoundingClientRect();

			if (window.innerWidth < menuOffsetLeft + width || window.innerWidth < menuOffsetLeft + 600) {
				menuOffsetLeft = anchorRect.left - 10 - (width > 600 ? 600 : width);
			}

			return {
				top: anchorRect.top,
				left: menuOffsetLeft,
			};
		}

		return null;
	}, [anchorEl]);

	const setPositioningStyles = React.useCallback(() => {
		const offset = getAnchorOffset();
		if (offset && menuRef.current) {
			menuRef.current.style.left = `${offset.left}px`;
			menuRef.current.style.top = `${offset.top}px`;
		}
	}, [getAnchorOffset]);

	React.useEffect(() => {
		if (isMenuOpened) {
			setPositioningStyles();
		}
	}, [isMenuOpened, setPositioningStyles]);

	return (
		<ModalPortal isOpen={isMenuOpened}>
			<div
				className={`graph-menu ${isMenuOpened ? 'active' : ''}`}
				ref={menuRef}
				style={{ visibility: !isMenuOpened ? 'hidden' : 'visible' }}>
				<ul className='graph-item-group__list'>
					{items.map(item => (
						<li
							key={isEventMessage(item.value) ? item.value.messageId : item.value.eventId}
							className='graph-menu__item'
							onClick={() => onMenuItemClick(item.value)}>
							<div
								className={createStyleSelector(
									'graph-menu__item-icon',
									`${item.type}-icon`,
									isEventNode(item.value) ? getEventStatus(item.value) : null,
								)}
							/>
							<div className='graph-menu__item-name'>
								{isEventMessage(item.value) ? item.value.messageId : item.value.eventName}
							</div>
							<div className='graph-menu__item-timestamp'>
								{moment(
									getTimestampAsNumber(
										isEventMessage(item.value) ? item.value.timestamp : item.value.startTimestamp,
									),
								)
									.utc()
									.format('DD.MM.YYYY HH:mm:ss:SSS')}
							</div>
						</li>
					))}
				</ul>
			</div>
		</ModalPortal>
	);
}
