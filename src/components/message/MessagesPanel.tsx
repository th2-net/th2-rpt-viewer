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
import MessagesCardList from './MessagesCardList';
import { HeatmapElement, MessagesHeatmapCtx } from './MessagesHeatmap';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { nextCyclicItem, prevCyclicItem } from '../../helpers/array';
import KeyCodes from '../../util/KeyCodes';
import useCachedEvent from '../../hooks/useCachedEvent';

interface Props {
	isOpen: boolean;
	onClose: () => void;
}

const MessagesPanel = ({ isOpen, onClose }: Props) => {
	const [heatmapElements, setHeatmapElements] = React.useState<HeatmapElement[]>([]);

	const rootRef = React.useRef<HTMLDivElement>(null);

	const eventWindowStore = useEventWindowStore();
	const messagesStore = useMessagesStore();

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

	const selectNextMessage = () => {
		const ids = selectedEvent?.attachedMessageIds;
		if (!ids || ids.length <= 1) return;
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
		const ids = selectedEvent?.attachedMessageIds;
		if (!ids || ids.length <= 1) return;
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

	const rootClassName = createStyleSelector(
		'messages-panel',
		isOpen ? 'open' : null,
	);

	const navButtonClass = createStyleSelector(
		'messages-panel__button',
		(selectedEvent?.attachedMessageIds || []).length <= 1 ? 'disabled' : null,
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
		<MessagesHeatmapCtx.Provider value={{
			heatmapElements,
			setHeatmapElements,
		}}>
			<div
				className={rootClassName}
				ref={rootRef}>
				<div
					className="messages-panel__close-button"
					role="button"
					title="close"
					onClick={() => onClose()}/>
				<div className="messages-panel__header">
					<h2 className="messages-panel__title">
						Messages
						{
							selectedEvent
								? ` for ${selectedEvent.eventName}`
								: null
						}
					</h2>
					{
						(
							!messagesStore.isLoading
							&& messagesStore.messagesIds.length > 0
							&& (selectedEvent?.attachedMessageIds || []).length > 0)
						&& 	<div className="messages-panel__buttons">
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
						</div>}
				</div>
				<div className="messages-panel__list">
					<MessagesCardList />
				</div>
			</div>
		</MessagesHeatmapCtx.Provider>
	);
};

export default observer(MessagesPanel);
