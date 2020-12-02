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
import { motion, AnimatePresence } from 'framer-motion';
import { getTimestampAsNumber } from '../../helpers/date';
import { createBemElement } from '../../helpers/styleCreators';
import { useOutsideClickListener } from '../../hooks';
import { EventAction } from '../../models/EventAction';
import { EventMessage } from '../../models/EventMessage';
import { ModalPortal } from '../Portal';
import { isEqual } from '../../helpers/object';
import { AttachedItem } from './GraphChunk';

interface GraphAttachedItemProps {
	items: AttachedItem[];
	leftPosition: number;
	bottomPosition: number;
	isInfoOpen: boolean;
	setExpandedItem: (item: EventAction | EventMessage | null) => void;
	className?: string;
}

const GraphAttachedItem = ({
	items,
	leftPosition,
	bottomPosition,
	isInfoOpen,
	setExpandedItem,
	className,
}: GraphAttachedItemProps) => {
	const itemRef = React.useRef<HTMLDivElement>(null);
	const itemRect = itemRef.current?.getBoundingClientRect();
	const itemGlobalPosition = itemRect
		? {
				left: itemRect.left,
				top: itemRect.top,
		  }
		: {
				left: 0,
				top: 0,
		  };

	const itemClass = createBemElement(
		'graph-chunk',
		items[0].type,
		items[0].type === 'event'
			? (items[0].value as EventAction).successful
				? 'passed'
				: 'failed'
			: null,
	);

	useOutsideClickListener(itemRef, () => setExpandedItem(null));

	return (
		<>
			{!isInfoOpen && (
				<div
					style={{
						position: 'absolute',
						left: leftPosition,
						bottom: bottomPosition,
					}}
					ref={itemRef}
					className={className || itemClass}
					onClick={() => setExpandedItem(items[0].value)}
					onMouseDown={e => e.stopPropagation()}
				/>
			)}
			<AnimatePresence exitBeforeEnter>
				{isInfoOpen && (
					<ModalPortal isOpen={true}>
						<div
							style={{
								left: itemGlobalPosition.left,
								top: itemGlobalPosition.top,
							}}
							onClick={() => setExpandedItem(null)}
							onScroll={e => e.stopPropagation()}
							onMouseDown={e => e.stopPropagation()}
							className='graph-chunk__item'>
							<div className={itemClass} />
							<motion.div
								initial={{
									transform: 'scale(0.01)',
								}}
								animate={{
									transform: 'scale(1)',
								}}
								exit={{
									transform: 'scale(0.01)',
								}}
								transition={{
									duration: 0.1,
									type: 'tween',
								}}
								className='graph-chunk__item-info'>
								{items.map((item, index) => (
									<div key={index} className='graph-chunk__info-item'>
										<div className='graph-chunk__item-name'>
											{items[0].type === 'event'
												? (items[0].value as EventAction).eventName
												: (items[0].value as EventMessage).messageId}
										</div>
										<div className='graph-chunk__item-timestamp'>
											{moment(
												getTimestampAsNumber(
													items[0].type === 'event'
														? (items[0].value as EventAction).startTimestamp
														: (items[0].value as EventMessage).timestamp,
												),
											).format('DD.MM.YYYY HH:mm:ss:SSS')}
										</div>
									</div>
								))}
							</motion.div>
						</div>
					</ModalPortal>
				)}
			</AnimatePresence>
		</>
	);
};

interface GraphAttachedItemGroupProps {
	group: {
		items: AttachedItem[];
		left: number;
	};
	expandedAttachedItem: EventAction | EventMessage | null;
	setExpandedAttachedItem: (item: EventAction | EventMessage | null) => void;
}

const ATTACHED_ITEM_STEP = 15;

const GraphAttachedItemGroup = ({
	group,
	expandedAttachedItem,
	setExpandedAttachedItem,
}: GraphAttachedItemGroupProps) => {
	return group.items.length < 4 ? (
		<>
			{group.items.map((item, index) => (
				<GraphAttachedItem
					key={index}
					leftPosition={group.left}
					bottomPosition={ATTACHED_ITEM_STEP * (index + 1)}
					items={[item]}
					isInfoOpen={expandedAttachedItem ? isEqual(expandedAttachedItem, item.value) : false}
					setExpandedItem={setExpandedAttachedItem}
					className={
						group.items.length === 1 && group.items[0].type === 'pinned-message'
							? 'graph-chunk__pinned-message full'
							: undefined
					}
				/>
			))}
		</>
	) : (
		<GraphAttachedItem
			leftPosition={group.left}
			bottomPosition={ATTACHED_ITEM_STEP}
			items={group.items}
			isInfoOpen={
				expandedAttachedItem ? isEqual(expandedAttachedItem, group.items[0].value) : false
			}
			setExpandedItem={setExpandedAttachedItem}
		/>
	);
};

export default GraphAttachedItemGroup;
