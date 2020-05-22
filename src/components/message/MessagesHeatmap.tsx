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
import { getHeatmapElements } from '../../helpers/heatmapCreator';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import { useMessagesHeatmap } from '../../hooks/useMessagesHeatmap';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import useCachedEvent from '../../hooks/useCachedEvent';

const DEFAULT_COLOR = '#987DB3';
const HEATMAP_ELEMENT_MIN_HEIGHT = 14;

interface MessagesHeatmapContext {
	heatmapElements: HeatmapElement[];
	setHeatmapElements: (heatmapElements: HeatmapElement[]) => void;
}

export const MessagesHeatmapCtx = React.createContext({} as MessagesHeatmapContext);

export interface HeatmapElement {
	count: number;
	color?: string;
	id?: string;
	index: number;
}

const MessagesHeatmap = () => {
	const heatmapRef = React.useRef<HTMLDivElement>(null);
	const { heatmapElements, setHeatmapElements } = useMessagesHeatmap();
	const messagesStore = useMessagesStore();
	const eventWindowStore = useEventWindowStore();

	const selectedEvent = eventWindowStore.selectedNode
		? eventWindowStore.eventsCache.get(eventWindowStore.selectedNode.id)
		: null;

	React.useEffect(() => {
		setHeatmapElements(
			getHeatmapElements(
				messagesStore.messagesIds,
				selectedEvent?.attachedMessageIds || [],
				DEFAULT_COLOR,
			),
		);
	}, [eventWindowStore.selectedNode, messagesStore.messagesIds]);

	const scrollToMessage = (index: number | null) => {
		messagesStore.scrolledIndex = new Number(index);
	};

	const count = heatmapElements.reduce((acc: number, curr: HeatmapElement) => acc + curr.count, 0);

	const renderSteps = (startIndex: number, amount: number) => {
		const steps = [];

		for (let i = startIndex; i < startIndex + amount; i++) {
			steps.push(
				<div
					key={i}
					className="messages-heatmap__step"
					onClick={() => scrollToMessage(i)}/>,
			);
		}
		return steps;
	};

	return (
		<div
			className="messages-heatmap"
			ref={heatmapRef}>
			<div className="messages-heatmap__scroller">
				{heatmapElements.map((element: HeatmapElement, index: number) =>
					element.count > 0 && <div
						style={{
							borderColor: element.color,
							borderWidth: element.index === messagesStore.scrolledIndex ? '3px' : '2px',
							flexGrow: element.count / count,
							minHeight: element.id ? `${HEATMAP_ELEMENT_MIN_HEIGHT}px` : undefined,
						}}
						key={index}
						className="messages-heatmap__element">
						{renderSteps(element.index, element.count)}
					</div>)}
			</div>
		</div>
	);
};

export default observer(MessagesHeatmap);
