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

import {
	getHeatmapElements,
	getHeatmapRange,
	DEFAULT_HEATMAP_ELEMENT_COLOR,
	createHeatmapElement,
	DEFAULT_PIN_COLOR,
} from '../../helpers/heatmapCreator';
import { createHeatmapInputData } from '../util/creators';

/* eslint-disable max-len */
describe('[Helpers] heatmap', () => {
	describe('Heatmap creator', () => {
		test('generates empty heatmap', () => {
			const { items } = createHeatmapInputData(0, new Map(), []);
			const heatmapElement = getHeatmapElements(
				items,
				new Map(),
				[],
			);
			expect(heatmapElement).toEqual([createHeatmapElement(0, 1)]);
		});

		test('generates heatmap with selected items', () => {
			const selectedItemsMap: Map<string, number[]> = new Map();
			selectedItemsMap.set(DEFAULT_HEATMAP_ELEMENT_COLOR, [2, 3]);
			const {
				items,
				selectedItems,
				pinnedItems,
			} = createHeatmapInputData(
				5,
				selectedItemsMap,
				[],
			);

			const heatmapElements = getHeatmapElements(
				items,
				selectedItems,
				pinnedItems,
			);

			expect(heatmapElements).toEqual([
				createHeatmapElement(0, 2),
				createHeatmapElement(2, 1, selectedItems.get(DEFAULT_HEATMAP_ELEMENT_COLOR)![0], [DEFAULT_HEATMAP_ELEMENT_COLOR]),
				createHeatmapElement(3, 1, selectedItems.get(DEFAULT_HEATMAP_ELEMENT_COLOR)![1], [DEFAULT_HEATMAP_ELEMENT_COLOR]),
				createHeatmapElement(4, 1),
			]);
		});

		test('generates heatmap with pinned items', () => {
			const selectedItemsMap: Map<string, number[]> = new Map();
			selectedItemsMap.set(DEFAULT_HEATMAP_ELEMENT_COLOR, [0, 3]);
			const pinnedItemsIndexes = [2];
			const {
				items,
				selectedItems,
				pinnedItems,
			} = createHeatmapInputData(7, selectedItemsMap, pinnedItemsIndexes);

			const heatmapElements = getHeatmapElements(
				items,
				selectedItems,
				pinnedItems,
			);

			expect(heatmapElements).toEqual([
				createHeatmapElement(0, 1, selectedItems.get(DEFAULT_HEATMAP_ELEMENT_COLOR)![0], [DEFAULT_HEATMAP_ELEMENT_COLOR]),
				createHeatmapElement(1, 1),
				createHeatmapElement(2, 1, pinnedItems[0], [DEFAULT_PIN_COLOR], true),
				createHeatmapElement(3, 1, selectedItems.get(DEFAULT_HEATMAP_ELEMENT_COLOR)![1], [DEFAULT_HEATMAP_ELEMENT_COLOR]),
				createHeatmapElement(4, 3),
			]);
		});

		test('heatmap with multiple colors', () => {
			const selectedItemsMap: Map<string, number[]> = new Map();
			const color1 = '#E69900';
			const color2 = '#45A155';
			selectedItemsMap.set(color1, [3, 11]);
			selectedItemsMap.set(color2, [3, 4]);
			const pinnedItemsIndexes = [3, 9];
			const {
				items,
				selectedItems,
				pinnedItems,
			} = createHeatmapInputData(13, selectedItemsMap, pinnedItemsIndexes);

			const heatmapElements = getHeatmapElements(
				items,
				selectedItems,
				pinnedItems,
			);

			expect(heatmapElements).toEqual([
				createHeatmapElement(0, 3),
				createHeatmapElement(3, 1, selectedItems.get(color1)![0], [color1, color2], true),
				createHeatmapElement(4, 1, selectedItems.get(color2)![1], [color2]),
				createHeatmapElement(5, 4),
				createHeatmapElement(9, 1, pinnedItems[1], [DEFAULT_PIN_COLOR], true),
				createHeatmapElement(10, 1),
				createHeatmapElement(11, 1, selectedItems.get(color1)![1], [color1]),
				createHeatmapElement(12, 1),
			]);
		});
	});

	describe('Heatmap range generator', () => {
		const selectedItemsMap: Map<string, number[]> = new Map();
		selectedItemsMap.set(DEFAULT_HEATMAP_ELEMENT_COLOR, [2, 40]);

		const { items, selectedItems } = createHeatmapInputData(50, selectedItemsMap, []);

		test('Should return range between first and last selected heatmap points', () => {
			const heatmap = getHeatmapElements(items, selectedItems);
			const range = getHeatmapRange(heatmap, false);
			expect(range).toEqual({
				startIndex: 2,
				endIndex: 40,
			});
		});

		test('Should return full range', () => {
			const heatmap = getHeatmapElements(items, selectedItems);
			const range = getHeatmapRange(heatmap, true);
			expect(range).toEqual({
				startIndex: 0,
				endIndex: 49,
			});
		});
	});
});
