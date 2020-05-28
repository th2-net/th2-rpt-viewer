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


import React, { useEffect, useState } from 'react';
import { getHeatmapElements, getHeatmapRange } from '../../helpers/heatmapCreator';
import { HeatmapElement, ListRange } from '../../models/Heatmap';
import { HeatmapContext } from '../../contexts/heatmapContext';

interface HeatmapProviderProps {
	children: React.ReactNode;
	items: string[];
	selectedItems: string[];
	pinnedItems: string[];
	colors: string[];
	selectedIndex: number | null;
	onElementClick: (element: HeatmapElement) => void;
	scrollToItem: (index: number) => void;
}

export const HeatmapProvider = ({
	children,
	items,
	pinnedItems,
	scrollToItem,
	selectedItems,
}: HeatmapProviderProps) => {
	const [heatmapElements, setHeatmapElements] = React.useState<HeatmapElement[]>([]);
	const [fullRange, setFullRange] = useState<ListRange | null>(null);
	const [visibleRange, setVisibleRange] = useState<ListRange | null>(null);

	useEffect(() => {
		const updatedHeatmap = getHeatmapElements(
			items,
			selectedItems,
			pinnedItems,
		);
		const updatedRange = getHeatmapRange(updatedHeatmap, selectedItems.length === 1);
		setHeatmapElements(updatedHeatmap);
		setFullRange(updatedRange);

		const selected = selectedItems.filter(i => items.includes(i));
		const firstSelectedItem = selected.length > 0
			? selected.map(item => items.indexOf(item))[0]
			: heatmapElements.find(heatmapEl => heatmapEl.id !== undefined)?.index;

		if (firstSelectedItem) {
			scrollToItem(firstSelectedItem);
		}
	}, [items, selectedItems]);

	useEffect(() => {
		setHeatmapElements(
			getHeatmapElements(
				items,
				selectedItems,
				pinnedItems,
			),
		);
	}, [pinnedItems]);

	React.useEffect(() => {
		if (
			(visibleRange && fullRange)
			&& (
				(visibleRange.startIndex + 1) < fullRange.startIndex
				|| (visibleRange.endIndex - 1) > fullRange.endIndex)
		) {
			setFullRange(getHeatmapRange(heatmapElements, true));
		}
	}, [visibleRange]);

	return <HeatmapContext.Provider value={{
		visibleRange,
		setVisibleRange,
		fullRange,
		setFullRange,
		heatmapElements,
		setHeatmapElements,
	}}>
		{children}
	</HeatmapContext.Provider>;
};
