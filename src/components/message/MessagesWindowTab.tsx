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
import DraggableTab, { DraggableTabProps } from '../tabs/DraggableTab';
import Tab from '../tabs/Tab';
import TabMenu from '../tabs/TabMenu';
import { DraggableTabListContext } from '../tabs/DroppableTabList';
import { useSelectedStore } from '../../hooks';
import { createStyleSelector } from '../../helpers/styleCreators';
import { getEventStatus } from '../../helpers/event';

// TODO: delete component

type Props = Omit<DraggableTabProps, 'children'> & {
	isDuplicable: boolean;
};

const MessagesWindowTab = (tabProps: Props) => {
	const { isClosable, isSelected, closeTab, tabIndex, duplicateTab, isDuplicable } = tabProps;

	const selectedStore = useSelectedStore();
	const [isMenuOpen, setIsMenuOpen] = React.useState(false);
	const tabRef = React.useRef<HTMLDivElement>(null);
	const menuRef = React.useRef<HTMLDivElement>(null);

	const { isDragging } = React.useContext(DraggableTabListContext);

	React.useEffect(() => {
		if (tabRef.current) {
			tabRef.current?.addEventListener('mouseenter', showMenu);
		}

		return () => {
			if (tabRef.current) {
				tabRef.current?.removeEventListener('mouseenter', showMenu);
			}
		};
	}, []);

	const showMenu = () => {
		setIsMenuOpen(true);
		document.documentElement.addEventListener('mousemove', onMouseMove);
	};

	const onMouseMove = (e: MouseEvent) => {
		if (
			e.target instanceof Node &&
			!tabRef.current?.contains(e.target) &&
			!menuRef.current?.contains(e.target)
		) {
			setIsMenuOpen(false);
			document.documentElement.removeEventListener('mousemove', onMouseMove);
		}
	};

	const getMenuWidth = () => {
		const tabWidth = tabRef.current?.getBoundingClientRect().width || 0;

		return Math.max(450, tabWidth);
	};

	return (
		<DraggableTab {...tabProps} classNames={{ root: 'messages-tab' }} ref={tabRef}>
			<div className='messages-tab__wrapper'>
				<div className='messages-tab__title' title='Messages'>
					{/* {(selectedStore.isLoadingEvents || selectedStore.isLoadingAttachedMessages) && (
						<div className='messages-tab__spinner' />
					)} */}
					Messages
				</div>
				<div className='messages-tab__count-list'>
					{/* {selectedStore.selectedEvents
						.filter(e => e.attachedMessageIds.length > 0)
						.map(({ eventId, attachedMessageIds }) => (
							<CountCircle
								key={eventId}
								color={selectedStore.eventColors.get(eventId)!}
								count={attachedMessageIds.length}
							/>
						))} */}
				</div>
				{isMenuOpen && !isDragging && (
					<TabMenu
						menuWidth={getMenuWidth()}
						isSelected={!!isSelected}
						ref={menuRef}
						closeTab={() => closeTab && closeTab(tabIndex)}
						duplicateTab={() => duplicateTab && duplicateTab(tabIndex)}
						isClosable={!!isClosable}
						isDuplicable={isDuplicable}
						tabRect={tabRef.current?.getBoundingClientRect()}>
						<ul className='messages-tab__event-list'>
							{selectedStore.selectedEvents
								.filter(e => e.attachedMessageIds.length > 0)
								.map(event => (
									<li key={event.eventId} className='messages-tab__event-row'>
										<span
											className={createStyleSelector(
												'messages-tab__event-title',
												getEventStatus(event),
											)}
											title={event.eventName}>
											{event.eventName}
										</span>
										{/* <CountCircle
											key={event.eventId}
											color={selectedStore.eventColors.get(event.eventId)!}
											count={event.attachedMessageIds.length}
										/> */}
									</li>
								))}
						</ul>
					</TabMenu>
				)}
			</div>
		</DraggableTab>
	);
};

export default observer(MessagesWindowTab);

interface MessagesWindowTabPreviewProps {
	isSelected: boolean;
}
export const MessagesWindowTabPreview = ({ isSelected }: MessagesWindowTabPreviewProps) => {
	const selectedStore = useSelectedStore();

	return (
		<Tab isDragging={true} isSelected={isSelected}>
			<div className='messages-tab__wrapper'>
				<span className='messages-tab__title' title='Messages'>
					Messages
				</span>
				<div className='messages-tab__count-list'>
					{/* {selectedStore.selectedEvents
						.filter(e => e.attachedMessageIds.length > 0)
						.map(({ eventId, attachedMessageIds }) => (
							<span
								key={eventId}
								className='messages-tab__count'
								style={{ borderColor: selectedStore.eventColors.get(eventId) }}>
								{attachedMessageIds.length}
							</span>
						))} */}
				</div>
			</div>
		</Tab>
	);
};
