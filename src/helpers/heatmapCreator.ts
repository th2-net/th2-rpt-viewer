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

export const DEFAULT_HEATMAP_ELEMENT_COLOR = '#987DB3';
export const DEFAULT_PIN_COLOR = '#4D4D4D';

export const getHeatmapElements = (
	items: string[],
	selectedItems: Map<string, string[]>,
	pinnedItems: string[] = [],
	pinColor = DEFAULT_PIN_COLOR,
): HeatmapElement[] => {
	const emptyHeatmap = [createHeatmapElement(0, items.length || 1)];
	if (!selectedItems.size && !pinnedItems.length) return emptyHeatmap;

	let points: [number, string][] = [];

	selectedItems.forEach((ids, color) => ids.forEach(id => points.push([items.indexOf(id), color])));

	pinnedItems
		.map(pinnedItemId => items.indexOf(pinnedItemId))
		.filter(pinnedItemIndex => points.findIndex(([index]) => pinnedItemIndex === index) === -1)
		.forEach(index => points.push([index, pinColor]));

	points = points.filter(([itemIndex], i, self) =>
		itemIndex !== -1 && self.findIndex(([index]) => index === itemIndex) === i);

	points.sort(([indexA], [indexB]) => indexA - indexB);

	const heatmapElements = points
		.reduce<HeatmapElement[]>((blocks, [itemIndex, color], index) => {
			const isPinned = pinnedItems.includes(items[itemIndex]);
			const [nextIndex] = points[index + 1] || [];
			blocks.push(
				createHeatmapElement(
					itemIndex,
					1,
					items[itemIndex],
					color,
					isPinned,
				),
			);

			if (nextIndex && nextIndex - itemIndex !== 1) {
				blocks.push(
					createHeatmapElement(
						itemIndex + 1,
						nextIndex - itemIndex - 1,
					),
				);
			}
			return blocks;
		}, []);

	if (!heatmapElements.length) return emptyHeatmap;

	const firstEl = heatmapElements[0];
	const lastEl = heatmapElements[heatmapElements.length - 1];

	return [
		createHeatmapElement(0, firstEl.index ? firstEl.index : 0),
		...heatmapElements,
		createHeatmapElement(lastEl.index + 1, items.length - lastEl.index - 1),
	].filter(el => el.count !== 0);
};

export const getHeatmapRange = (
	heatmapElements: HeatmapElement[],
	fullRange = false,
): ListRange => {
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
		const end = heatmapElements
			.slice()
			.reverse()
			.findIndex(el => el.id !== undefined);
		endIndex = end >= 0 ? heatmapElements.length - 1 - end : end;
	}

	return {
		startIndex: heatmapElements[startIndex].index,
		endIndex:
			heatmapElements[endIndex].index + heatmapElements[endIndex].count - 1,
	};
};

export const inRange = (
	heatmapElement: HeatmapElement,
	range: ListRange | null,
) => {
	if (!range) return true;
	const { startIndex, endIndex } = range;
	const { index, count } = heatmapElement;
	const elEnd = index + count - 1;

	return elEnd >= startIndex && elEnd <= endIndex;
};

export const isHeatmapPoint = (heatmapEl: HeatmapElement) =>
	heatmapEl.id !== undefined;

export const createHeatmapElement = (
	index: number,
	count: number,
	id?: string,
	color?: string,
	isPinned = false,
): HeatmapElement => ({
	index,
	count,
	id,
	color,
	isPinned,
});
