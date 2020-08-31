/** *****************************************************************************
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
import EventBreadcrumbs from './EventBreadcrumbs';
import TabMenu from '../tabs/TabMenu';
import { EventWindowProvider } from '../../contexts/eventWindowContext';
import DraggableTab, { DraggableTabProps } from '../tabs/DraggableTab';
import Tab from '../tabs/Tab';
import EventWindowStore, { EventIdNode } from '../../stores/EventsStore';
import { DraggableTabListContext } from '../tabs/DroppableTabList';
import '../../styles/events.scss';

type EventsWindowTabProps = Omit<DraggableTabProps, 'children'> & {
	store: EventWindowStore;
	isDuplicable: boolean;
};

const EventsWindowTab = (props: EventsWindowTabProps) => {
	const {
		store,
		isDuplicable = true,
		...tabProps
	} = props;

	const {
		duplicateTab,
		isClosable = true,
		tabIndex,
		closeTab,
		isSelected,
	} = tabProps;

	const {
		isDragging,
	} = React.useContext(DraggableTabListContext);

	const [isMenuOpen, setIsMenuOpen] = React.useState(false);
	const tabRef = React.useRef<HTMLDivElement>(null);
	const menuRef = React.useRef<HTMLDivElement>(null);

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
			e.target instanceof Node && !tabRef.current?.contains(e.target)
			&& !menuRef.current?.contains(e.target)
		) {
			setIsMenuOpen(false);
			document.documentElement.removeEventListener('mousemove', onMouseMove);
		}
	};

	const onClose = () => {
		if (closeTab && isClosable) {
			closeTab(tabIndex);
			setIsMenuOpen(false);
		}
	};

	const onDublicate = () => {
		if (duplicateTab && isDuplicable) {
			duplicateTab(tabIndex);
			setIsMenuOpen(false);
		}
	};

	const selectNode = (idNode: EventIdNode | null) => {
		store.selectNode(idNode);
		if (idNode) {
			store.scrollToEvent(idNode);
			setIsMenuOpen(false);
		}
	};

	const getApproxMenuWidth = () => {
		if (!tabRef.current) return 0;
		const MAX_WIDTH = 820;
		const MIN_WIDTH = 420;
		const { width: tabWidth } = tabRef.current?.getBoundingClientRect();
		if (tabWidth >= MAX_WIDTH) return tabWidth;

		const minWidth = tabWidth < MIN_WIDTH ? MIN_WIDTH : tabWidth;
		if (store.selectedPath.length === 0) return minWidth;

		return Math.min(minWidth + store.selectedPath.length * 170, MAX_WIDTH);
	};

	return (
		<DraggableTab ref={tabRef} {...tabProps}>
			<EventWindowProvider value={store}>
				<div className="events-tab">
					<div>
						{store.color && <div
							className="events-tab__color"
							style={{ borderColor: store.color, marginRight: 10 }}/>}
					</div>
					<div className="events-tab__title">
						<EventBreadcrumbs
							rootEventsEnabled={!store.selectedNode}
							nodes={store.selectedNode ? [store.selectedNode] : []}/>
					</div>
					{isMenuOpen && !isDragging && (
						<TabMenu
							menuWidth={getApproxMenuWidth()}
							isSelected={!!isSelected}
							ref={menuRef}
							closeTab={onClose}
							duplicateTab={onDublicate}
							isClosable={isClosable}
							isDuplicable={isDuplicable}
							tabRect={tabRef.current?.getBoundingClientRect()}>
							<div className="events-tab__content">
								<div
									className="events-tab__color"
									style={{ borderColor: store.color, marginTop: 10 }}/>
								<div className="events-tab__breadcrumbs">
									<EventBreadcrumbs
										nodes={store.selectedPath}
										onSelect={selectNode} />
								</div>
							</div>
						</TabMenu>
					)}
				</div>
			</EventWindowProvider>
		</DraggableTab>
	);
};

export default observer(EventsWindowTab);

interface EventsWindowTabPreviewProps {
	store: EventWindowStore;
	isSelected: boolean;
}

export const EventsWindowTabPreview = ({ store, isSelected }: EventsWindowTabPreviewProps) => (
	<Tab isDragging={true} isSelected={isSelected}>
		<EventWindowProvider value={store}>
			<div className="events-tab">
				<div>
					{store.color && <div
						className="events-tab__color"
						style={{ borderColor: store.color, marginRight: 10 }}/>}
				</div>
				<div className="events-tab__title">
					<EventBreadcrumbs
						rootEventsEnabled={!store.selectedNode}
						nodes={store.selectedNode ? [store.selectedNode] : []}/>
				</div>
			</div>
		</EventWindowProvider>
	</Tab>
);
