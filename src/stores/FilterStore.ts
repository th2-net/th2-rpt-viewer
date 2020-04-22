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

import { observable, action, computed } from 'mobx';
import { FilterBlock } from '../models/filter/FilterBlock';

export class FilterStore {
	@observable results: string[] = [];

	@observable blocks: FilterBlock[] = [];

	@observable isTransparent = false;

	@observable isHighlighted = false;

	@action
	setIsTransparent = (isTransparent: boolean) => {
		this.isTransparent = isTransparent;
	};


	@action
	setIsHighlighted = (isHighlighted: boolean) => {
		this.isHighlighted = isHighlighted;
	};

	@action
	setFilterResults = (results: string[]) => {
		this.results = results;
	};

	@action
	setFilterConfig = (blocks: FilterBlock[]) => {
		this.blocks = blocks;
	};

	@action
	setFilterIsTransparent = (isTransparent: boolean) => {
		this.isTransparent = isTransparent;
	};

	@action
	setFilterIsHighlighted = (isHighlighted: boolean) => {
		this.isHighlighted = isHighlighted;
	};

	@action
	resetFilter = () => {
		this.blocks = [];
		this.isHighlighted = false;
		this.results = [];
	};

	@computed get isFilterApplied() {
		return this.blocks.length > 0 && this.blocks.some(block => block.values.length > 0);
	}
}

const filterStore = new FilterStore();

export default filterStore;
