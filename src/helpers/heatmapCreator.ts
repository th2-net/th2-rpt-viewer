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

import { HeatmapElement, ListRange } from '../models/Heatmap';

export const getHeatmapElements = (
	items: string[],
	selectedItems: string[],
	pinnedItems: string[],
	color = '#987DB3',
	pinColor = '#00BBCC',
): HeatmapElement[] => {
	const emptyHeatmap = [{ count: items.length || 1, index: 0 }];

	if (!selectedItems.length && !pinnedItems.length) return emptyHeatmap;

	const presentIds = [...new Set([...selectedItems, ...pinnedItems])]
		.filter(id => items.includes(id));
	const idsIndexes = presentIds.map(id => items.indexOf(id));
	idsIndexes.sort((a, b) => a - b);

	const heatmapElements = idsIndexes.reduce((blocks, itemIndex, index) => {
		const isPinned = pinnedItems.includes(items[itemIndex]);
		const nextIndex = idsIndexes[index + 1];
		blocks.push({
			count: 1,
			color: isPinned ? pinColor : color,
			id: items[itemIndex],
			index: itemIndex,
		});
		if (nextIndex && nextIndex - itemIndex !== 1) {
			blocks.push({
				count: nextIndex - itemIndex - 1,
				index: itemIndex + 1,
			});
		}
		return blocks;
	}, [] as HeatmapElement[]);

	if (!heatmapElements.length) return emptyHeatmap;

	const firstEl = heatmapElements[0];
	const lastEl = heatmapElements[heatmapElements.length - 1];

	return [
		{ count: firstEl.index ? firstEl.index : 0, index: 0 },
		...heatmapElements,
		{ count: items.length - lastEl.index - 1, index: lastEl.index + 1 },
	].filter(el => el.count !== 0);
};


export const getHeatmapRange = (heatmapElements: HeatmapElement[], fullRange = false): ListRange => {
	if (heatmapElements.filter(isHeatmapPoint).length <= 1) {
		const lastHeatmapElement = heatmapElements[heatmapElements.length - 1];
		return {
			startIndex: 0,
			endIndex: lastHeatmapElement
				? lastHeatmapElement.index + lastHeatmapElement.count
				: 0,
		};
	}

	let startIndex = 0;
	let endIndex = heatmapElements.length - 1;
	if (!fullRange) {
		startIndex = heatmapElements.findIndex(el => el.id !== undefined);
		const end = heatmapElements.slice().reverse().findIndex(el => el.id !== undefined);
		endIndex = end >= 0 ? heatmapElements.length - 1 - end : end;
	}

	return {
		startIndex: heatmapElements[startIndex].index,
		endIndex: heatmapElements[endIndex].index + heatmapElements[endIndex].count - 1,
	};
};

export const inRange = (heatmapElement: HeatmapElement, range: ListRange | null) => {
	if (!range) return true;
	const { startIndex, endIndex } = range;
	const { index, count } = heatmapElement;
	const elEnd = index + count - 1;
	const isInRange = elEnd >= startIndex && elEnd <= endIndex;
	return isInRange;
};

export const isHeatmapPoint = (heatmapEl: HeatmapElement) => heatmapEl.id !== undefined;
