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
import SearchResult from '../helpers/search/SearchResult';
import ApiSchema from '../api/ApiSchema';
import EventsStore, { EventIdNode } from './EventsStore';

export default class SearchStore {
	constructor(private api: ApiSchema, private eventsStore: EventsStore) {}

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
		return this.eventsStore.nodesList
			.map(node => node.id)
			.filter(nodeId => this.rawResults.includes(nodeId));
	}

	@action
	updateTokens = async (nextTokens: SearchToken[]) => {
		this.isLoading = true;
		this.tokens = nextTokens;

		const rootEventsResults = await Promise.all(
			nextTokens.map(token => this.fetchTokenResults(token.pattern)),
		);
		// only unique ids
		this.rawResults = [...new Set(rootEventsResults.flat())];
		this.scrolledIndex = null;
	};

	@action
	fetchTokenResults = async (tokenString: string) => {
		const rootEventsResults = await this.api.events.getEventsByName(tokenString);

		const expandedSubNodes = this.eventsStore.nodesList
			.filter(node => node.isExpanded && node.children && node.children.length > 0);

		const subNodesResult = await Promise.all(
			expandedSubNodes.map(node => this.api.events.getEventsByName(tokenString, node.id)),
		);

		return [...rootEventsResults, ...subNodesResult.flat(2)];
	};

	@action
	appendResultsForEvent = async (eventId: string) => {
		this.isLoading = true;
		const results = await Promise.all(
			this.tokens.map(token => this.api.events.getEventsByName(token.pattern, eventId)),
		);
		this.isLoading = false;
		this.scrolledIndex = null;

		this.rawResults.push(...new Set(results.flat()));
	};

	@action
	removeEventsResults = (nodesIds: string[]) => {
		this.rawResults = this.rawResults.filter(
			result => !nodesIds.includes(result),
		);
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

	static copy(searchStore: SearchStore, api: ApiSchema, eventsStore: EventsStore) {
		const copy = new SearchStore(api, eventsStore);
		copy.tokens = toJS(searchStore.tokens);
		copy.isLoading = toJS(searchStore.isLoading);
		copy.scrolledIndex = toJS(searchStore.scrolledIndex);
		copy.rawResults = toJS(searchStore.rawResults);

		return copy;
	}
}
