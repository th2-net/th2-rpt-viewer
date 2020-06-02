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
import MessagesFilter from '../models/filter/MessagesFilter';

const ONE_HOUR = 60 * 60 * 1000;

export default class FilterStore {
	@observable results: string[] = [];

	@observable blocks: FilterBlock[] = [];

	@observable isTransparent = false;

	@observable isHighlighted = false;

	@observable messagesFilter: MessagesFilter = {
		timestampFrom: new Date(new Date().getTime() - ONE_HOUR).getTime(),
		timestampTo: new Date().getTime(),
		stream: null,
		messageType: null,
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

	@computed get isFilterApplied() {
		return this.blocks.length > 0 && this.blocks.some(block => block.values.length > 0);
	}

	@action
	setMessagesFromTimestamp(timestamp: number) {
		this.messagesFilter.timestampFrom = timestamp;
	}

	@action
	setMessagesToTimestamp(timestamp: number) {
		this.messagesFilter.timestampTo = timestamp;
	}

	@action
	setMessagesStream(stream: string | null) {
		if (stream === '') {
			this.messagesFilter.stream = null;
		} else {
			this.messagesFilter.stream = stream;
		}
	}

	@action
	setMessagesType(messageType: string | null) {
		if (messageType === '') {
			this.messagesFilter.messageType = null;
		} else {
			this.messagesFilter.messageType = messageType;
		}
	}

	@action
	updateFilter(filter: MessagesFilter) {
		this.messagesFilter = filter;
	}
}
