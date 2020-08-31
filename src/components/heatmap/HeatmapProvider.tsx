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


import React, { useEffect, useState } from 'react';
import { getHeatmapElements, getHeatmapRange, DEFAULT_PIN_COLOR } from '../../helpers/heatmapCreator';
import { HeatmapElement, ListRange } from '../../models/Heatmap';
import { HeatmapContext } from '../../contexts/heatmapContext';

interface HeatmapProviderProps {
	children: React.ReactNode;
	items: string[];
	selectedItems: Map<string, string[]>;
	pinnedItems: string[];
	selectedIndex: number | null;
	colors?: string[];
	unknownAreas: {
		before: string[];
		after: string[];
	};
}

export const HeatmapProvider = ({
	children,
	items,
	pinnedItems,
	selectedItems,
	unknownAreas,
}: HeatmapProviderProps) => {
	const [heatmapElements, setHeatmapElements] = React.useState<HeatmapElement[]>(
		getHeatmapElements(items, selectedItems, pinnedItems),
	);
	const [unknownAreasHeatmapElements, setUnknownAreasHeatmapElements] = React.useState<{
		before: HeatmapElement[];
		after: HeatmapElement[];
	}>({
		before: getHeatmapElements(unknownAreas.before, selectedItems, [], DEFAULT_PIN_COLOR, true),
		after: getHeatmapElements(unknownAreas.after, selectedItems, [], DEFAULT_PIN_COLOR, true),
	});
	const [fullRange, setFullRange] = useState<ListRange | null>(null);
	const [visibleRange, setVisibleRange] = useState<ListRange | null>(null);

	useEffect(() => {
		const updatedHeatmap = getHeatmapElements(
			items,
			selectedItems,
			pinnedItems,
		);

		setHeatmapElements(updatedHeatmap);
		setFullRange(getHeatmapRange(updatedHeatmap));
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

	useEffect(() => {
		setUnknownAreasHeatmapElements({
			before: getHeatmapElements(unknownAreas.before, selectedItems, [], DEFAULT_PIN_COLOR, true),
			after: getHeatmapElements(unknownAreas.after, selectedItems, [], DEFAULT_PIN_COLOR, true),
		});
	}, [unknownAreas]);

	React.useEffect(() => {
		if (
			(visibleRange && fullRange)
			&& (
				(visibleRange.startIndex + 1) < fullRange.startIndex
				|| (visibleRange.endIndex - 1) > fullRange.endIndex
			)
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
		unknownAreas: unknownAreasHeatmapElements,
	}}>
		{children}
	</HeatmapContext.Provider>;
};
