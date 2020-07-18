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


import { createContext } from 'react';

import { HeatmapElement, ListRange } from '../models/Heatmap';

interface HeatmapContextState {
	heatmapElements: HeatmapElement[];
	setHeatmapElements: (heatmapElements: HeatmapElement[]) => void;
	visibleRange: ListRange | null;
	setVisibleRange: (range: ListRange) => void;
	fullRange: ListRange | null;
	setFullRange: (range: ListRange) => void;
	unknownAreas: {
		before: HeatmapElement[];
		after: HeatmapElement[];
	};
}

export const HeatmapContext = createContext({} as HeatmapContextState);
