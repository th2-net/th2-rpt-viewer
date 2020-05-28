/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import { createStyleSelector } from '../../helpers/styleCreators';
import { useHeatmap } from '../../hooks/useHeatmap';
import MessagesCardList from './MessagesCardList';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { nextCyclicItem, prevCyclicItem } from '../../helpers/array';
import KeyCodes from '../../util/KeyCodes';
import SidePanel from '../SidePanel';
import { HeatmapProvider } from '../heatmap/HeatmapProvider';
import { HeatmapElement } from '../../models/Heatmap';
import { useEventWindowViewStore } from '../../hooks/useEventWindowViewStore';


const MessagesPanel = observer(() => {
	const { heatmapElements } = useHeatmap();
	const eventWindowStore = useEventWindowStore();
	const messagesStore = useMessagesStore();
	const windowViewStore = useEventWindowViewStore();

	const selectedEvent = eventWindowStore.selectedNode
		? eventWindowStore.eventsCache.get(eventWindowStore.selectedNode.id)
		: null;

	const handleUserKeyPress = (event: KeyboardEvent) => {
		const { keyCode } = event;

		const selectPrev = keyCode === KeyCodes.UP || keyCode === KeyCodes.LEFT;
		const selectNext = keyCode === KeyCodes.DOWN || keyCode === KeyCodes.RIGHT;

		if (selectPrev) selectPrevMessage();

		if (selectNext) selectNextMessage();
	};

	React.useEffect(() => {
		window.addEventListener('keydown', handleUserKeyPress);

		return () => {
			window.removeEventListener('keydown', handleUserKeyPress);
		};
	}, [heatmapElements, eventWindowStore.selectedNode]);

	const hasAttachedMessages = ((selectedEvent?.attachedMessageIds || []).length
	+ messagesStore.pinnedMessagesIds.length) > 0;

	const selectNextMessage = () => {
		if (!hasAttachedMessages) return;
		const indexes = heatmapElements
			.filter(el => Boolean(el.id))
			.map(el => el.index);
		if (!messagesStore.scrolledIndex || indexes.indexOf(messagesStore.scrolledIndex.valueOf()) === -1) {
			messagesStore.scrolledIndex = new Number(indexes[0]);
			return;
		}
		const nextIndex = nextCyclicItem(indexes, messagesStore.scrolledIndex.valueOf());
		messagesStore.scrolledIndex = new Number(nextIndex);
	};

	const selectPrevMessage = () => {
		if (!hasAttachedMessages) return;
		const indexes = heatmapElements
			.filter(el => Boolean(el.id))
			.map(el => el.index);
		if (!messagesStore.scrolledIndex || indexes.indexOf(messagesStore.scrolledIndex.valueOf()) === -1) {
			messagesStore.scrolledIndex = new Number(indexes[indexes.length - 1]);
			return;
		}
		const prevIndex = prevCyclicItem(indexes, messagesStore.scrolledIndex.valueOf());
		messagesStore.scrolledIndex = new Number(prevIndex);
	};

	const navButtonClass = createStyleSelector(
		'messages-panel__button',
		!hasAttachedMessages ? 'disabled' : null,
	);

	const getStep = () => {
		const messagesIndexes = heatmapElements
			.filter(m => m.id !== undefined)
			.map(m => m.index);
		const step = messagesStore.scrolledIndex
			? messagesIndexes.indexOf(messagesStore.scrolledIndex.valueOf()) + 1
			: 0;
		return `${step} of ${messagesIndexes.length}`;
	};

	return (
		<SidePanel
			isOpen={windowViewStore.showMessages}
			onClose={() => windowViewStore.showMessages = false}>
			<div className="messages-panel">
				<div className="messages-panel__header">
					<h2 className="messages-panel__title">
						Messages
						{
							selectedEvent
								? ` for ${selectedEvent.eventName}`
								: null
						}
					</h2>
					<div className="messages-panel__controls">
						{
							!messagesStore.isLoading
							&& hasAttachedMessages
							&& <>
								<div
									className={navButtonClass}
									role="button"
									title="previous"
									onClick={selectPrevMessage}/>
								<div
									className={navButtonClass}
									role="button"
									title="next"
									onClick={selectNextMessage}/>
								<div className="messages-panel__counter">
									{getStep()}
								</div>
							</>
						}
						<div
							className="messages-panel__close-button"
							role="button"
							title="close"
							onClick={() => windowViewStore.showMessages = false}/>
					</div>
				</div>
				<div className="messages-panel__list">
					<MessagesCardList />
				</div>
			</div>
		</SidePanel>
	);
});

const MessagesHeatmapProvider = observer(() => {
	const eventWindowStore = useEventWindowStore();
	const messagesStore = useMessagesStore();

	const selectedItems = React.useMemo(() => {
		if (eventWindowStore.selectedNode) {
			return eventWindowStore.eventsCache
				.get(eventWindowStore.selectedNode.id)?.attachedMessageIds || [];
		}

		return [];
	}, [eventWindowStore.selectedNode, eventWindowStore.eventsCache]);

	return (
		<HeatmapProvider
			onElementClick={(element: HeatmapElement) =>
				messagesStore.scrolledIndex = new Number(element.index)}
			scrollToItem={(index: number) =>
				messagesStore.scrolledIndex = new Number(index)}
			items={messagesStore.messagesIds}
			selectedItems={selectedItems}
			colors={[]}
			selectedIndex={messagesStore.scrolledIndex?.valueOf() || null}
			pinnedItems={messagesStore.pinnedMessagesIds}>
			<MessagesPanel />
		</HeatmapProvider>
	);
});

export default MessagesHeatmapProvider;
