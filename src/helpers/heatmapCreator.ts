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

import { HeatmapElement } from '../components/message/MessagesHeatmap';

export const getHeatmapElements = (
	items: string[],
	selectedItems: string[],
	color: string,
): HeatmapElement[] => {
	if (!selectedItems.length) return [{ count: items.length, index: 0 }];

	const presentIds = selectedItems.filter(id => items.includes(id));
	const idsIndexes = presentIds.map(id => items.indexOf(id));
	const heatmapElements = idsIndexes.reduce((blocks, itemIndex, index) => {
		const nextIndex = idsIndexes[index + 1];
		const updatedBlocks = blocks.slice();
		updatedBlocks.push({
			count: 1,
			color,
			id: presentIds[index],
			index: itemIndex,
		});
		if (nextIndex && nextIndex - itemIndex !== 1) {
			updatedBlocks.push({
				count: nextIndex - itemIndex - 1,
				index: itemIndex + 1,
			});
		}
		return updatedBlocks;
	}, [] as HeatmapElement[]);

	if (!heatmapElements.length) return [{ count: items.length, index: 0 }];

	if (heatmapElements.length === 1) {
		const [elem] = heatmapElements;
		return [
			{ count: elem.index ? elem.index - 1 : 0, index: 0 },
			elem,
			{ count: elem.index ? items.length - elem.index - 1 : 0, index: elem.index + 1 },
		];
	}
	return heatmapElements;
};
