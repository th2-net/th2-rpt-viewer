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
import { Observer, observer } from 'mobx-react-lite';
import { TScrollContainer } from 'react-virtuoso';
import Heatmap, { HeatmapElement } from '../Heatmap';
import { useHeatmap } from '../../hooks/useHeatmap';
import { useMessagesStore } from '../../hooks/useMessagesStore';
import { useEventWindowStore } from '../../hooks/useEventWindowStore';
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback';

const MessagesScrollContainer: TScrollContainer = ({
	className,
	style,
	reportScrollTop,
	scrollTo,
	children,
}) => {
	const scrollContainer = React.useRef<HTMLDivElement>(null);
	const heatmapContext = useHeatmap();
	const messagesStore = useMessagesStore();
	const eventWindowStore = useEventWindowStore();

	const getRange = useDebouncedCallback(() => {
		if (!scrollContainer.current) return;
		const offsetTop = scrollContainer.current.offsetTop || 0;
		try {
			const fullyRendered = Array.from(scrollContainer.current.children[0].children[0].children)
				.filter(node => {
					const rect = node.getBoundingClientRect();
					const elemTop = rect.top - offsetTop + rect.height * 0.6;
					const elemBottom = rect.bottom - rect.height * 0.6;
					const isVisible = (elemTop >= 0) && (elemBottom <= window.innerHeight);
					return isVisible;
				})
				.map(node => (node as HTMLDivElement).dataset.index);
			if (fullyRendered.length > 0) {
				heatmapContext.setCurrentRange({
					startIndex: parseInt(fullyRendered[0] as string),
					endIndex: parseInt(fullyRendered[fullyRendered.length - 1] as string),
				});
			}
		} catch {
			heatmapContext.setCurrentRange({
				startIndex: 0,
				endIndex: 0,
			});
		}
	}, 50);

	React.useEffect(() => {
		getRange();
	}, [messagesStore.messagesCache.size]);

	scrollTo((scrollTop: ScrollToOptions) => {
		scrollContainer.current?.scrollTo(scrollTop);
	});

	const selectedItems = React.useMemo(() => {
		if (eventWindowStore.selectedNode) {
			return eventWindowStore.eventsCache.get(eventWindowStore.selectedNode.id)?.attachedMessageIds;
		}

		return [];
	}, [eventWindowStore.selectedNode, eventWindowStore.eventsCache]);

	return (
		<div style={{ width: '100%', height: '100%', display: 'flex' }}>
			<div
				ref={scrollContainer}
				onScroll={(e: React.SyntheticEvent<HTMLDivElement>) => {
					reportScrollTop(e.currentTarget.scrollTop);
					getRange();
				}}
				style={{
					...style,
					flexGrow: 1,
					marginRight: '11px',
				}}
				tabIndex={0}
				className={className}
			>
				{children}
			</div>
			<Observer>
				{() => <Heatmap
					onElementClick={(element: HeatmapElement) =>
						 messagesStore.scrolledIndex = new Number(element.index)}
					items={messagesStore.messagesIds}
					selectedItems={selectedItems}
					colors={[]}
					selectedIndex={messagesStore.scrolledIndex?.valueOf() || null}/>}
			</Observer>

		</div>
	);
};

export default observer(MessagesScrollContainer);
