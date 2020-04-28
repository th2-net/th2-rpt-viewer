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

import { action, computed, observable } from 'mobx';
import { FilterBlock } from '../models/filter/FilterBlock';
import ApiSchema from '../api/ApiSchema';
import FilterPath from '../models/filter/FilterPath';
import FilterType from '../models/filter/FilterType';
import { getTimeDate } from '../helpers/date';

const ONE_HOUR = 60 * 60 * 1000;

export default class FilterStore {
	private api: ApiSchema;

	constructor(api: ApiSchema) {
		this.api = api;
	}

	@observable results: string[] = [];

	@observable blocks: FilterBlock[] = [];

	@observable isTransparent = false;

	@observable isHighlighted = false;

	@observable timestampFromBlock: FilterBlock = {
		path: FilterPath.TIMESTAMP_FROM,
		types: [FilterType.MESSAGE],
		// start timestamp of a current date
		values: [new Date(new Date().getTime() - ONE_HOUR).toISOString()]
	};

	@observable timestampToBlock: FilterBlock = {
		path: FilterPath.TIMESTAMP_TO,
		types: [FilterType.MESSAGE],
		values: [new Date().toISOString()]
	};

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

	@action
	updateMessagesTimestampFilter = (timestampStart: number, timestampEnd: number) => {
		this.timestampFromBlock = {
			path: FilterPath.TIMESTAMP_FROM,
			types: [FilterType.MESSAGE],
			values: [new Date(timestampStart).toUTCString()],
		};

		this.timestampToBlock = {
			path: FilterPath.TIMESTAMP_TO,
			types: [FilterType.MESSAGE],
			values: [new Date(timestampEnd).toUTCString()],
		};
	};

	@computed get isFilterApplied() {
		return this.blocks.length > 0 && this.blocks.some(block => block.values.length > 0);
	}

	@computed
	get messagesFromTimestamp() {
		return this.timestampFromBlock.values[0];
	}

	@action
	setMessagesFromTimestamp(timestamp: number) {
		this.timestampFromBlock.values = [new Date(timestamp).toISOString()];
	}

	@computed
	get messagesToTimestamp() {
		return this.timestampToBlock.values[0];
	}
}
