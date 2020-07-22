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
import { mount } from 'enzyme';
import Heatmap from '../../components/heatmap/Heatmap';
import { HeatmapContext } from '../../contexts/heatmapContext';
import { getHeatmapElements, DEFAULT_HEATMAP_ELEMENT_COLOR } from '../../helpers/heatmapCreator';
import { createHeatmapInputData } from '../util/creators';

describe('Heatmap', () => {
	test('renders heatmap', () => {
		const selectedItemsMap: Map<string, number[]> = new Map();
		selectedItemsMap.set(DEFAULT_HEATMAP_ELEMENT_COLOR, [3, 27]);
		const {
			items,
			selectedItems,
			pinnedItems,
		} = createHeatmapInputData(40, selectedItemsMap, [15]);
		const heatmapElements = getHeatmapElements(items, selectedItems, pinnedItems);
		const mockFn = jest.fn();

		const wrapper = mount(
			<HeatmapContext.Provider value={{
				fullRange: null,
				setFullRange: mockFn,
				visibleRange: null,
				setVisibleRange: mockFn,
				heatmapElements,
				setHeatmapElements: mockFn,
				unknownAreas: { before: [], after: [] },
			}}>
				<Heatmap onElementClick={mockFn} selectedItem={null} />
			</HeatmapContext.Provider>,
		);

		const heatmapElementDivs = wrapper.find('[data-testid="heatmap-block"]');

		expect(heatmapElementDivs.length).toBe(heatmapElements.length);
	});
});
