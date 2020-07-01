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

import {
	action,
	computed,
	observable,
	toJS,
} from 'mobx';
import SearchToken from '../models/search/SearchToken';
import ApiSchema from '../api/ApiSchema';
import EventsStore from './EventsStore';

export default class SearchStore {
	constructor(private api: ApiSchema, private eventsStore: EventsStore, searchStore?: SearchStore) {
		if (searchStore) {
			this.tokens = toJS(searchStore.tokens);
			this.isLoading = toJS(searchStore.isLoading);
			this.scrolledIndex = toJS(searchStore.scrolledIndex);
			this.rawResults = toJS(searchStore.rawResults);
		}
	}

	@observable tokens: SearchToken[] = [];

	@observable private rawResults: string[] = [];

	@observable isLoading = false;

	@observable scrolledIndex: number | null = null;

	@computed
	get scrolledItem() {
		if (this.scrolledIndex == null) {
			return null;
		}

		return this.results[this.scrolledIndex];
	}

	@computed
	get results() {
		// we need to filter original array to keep it in correct order
		return this.eventsStore.eventsIds
			.map(node => node.id)
			.filter(nodeId => this.rawResults.includes(nodeId));
	}

	@action
	updateTokens = async (nextTokens: SearchToken[]) => {
		this.isLoading = true;
		this.tokens = nextTokens;

		const searchTokenResults = await Promise.all(
			nextTokens.map(token => this.api.events.getEventsByName(token.pattern)),
		);
		// only unique ids
		this.rawResults = [...new Set(searchTokenResults.flat())];
		this.scrolledIndex = null;
	};

	@action
	nextSearchResult = () => {
		this.scrolledIndex = this.scrolledIndex != null
			? (this.scrolledIndex + 1) % this.results.length
			: 0;
	};

	@action
	prevSearchResult = () => {
		this.scrolledIndex = this.scrolledIndex != null
			? (this.results.length + this.scrolledIndex - 1) % this.results.length
			: 0;
	};

	@action
	clear = () => {
		this.rawResults = [];
		this.tokens = [];
		this.scrolledIndex = null;
	};
}
