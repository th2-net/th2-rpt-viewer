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
} from 'mobx';
import SearchToken from '../models/search/SearchToken';
import ApiSchema from '../api/ApiSchema';
import EventsStore from './EventsStore';
import { createSearchToken } from '../helpers/search/createSearchToken';
import { COLORS as SearchTokenColors } from '../components/search/SearchInput';

const defaultState = {
	tokens: [],
	isLoading: false,
	scrolledIndex: null,
	rawResults: [],
};

type initialState = Partial<{
	tokens: SearchToken[];
	isLoading: boolean;
	scrolledIndex: number | null;
	rawResults: string[];
	searchPatterns: string[];
}>;

export default class SearchStore {
	constructor(
		private api: ApiSchema,
		private eventsStore: EventsStore,
		initialState?: initialState,
	) {
		this.init(initialState);
	}

	@observable tokens: SearchToken[] = [];

	@observable rawResults: string[] = [];

	@observable isLoading = false;

	@observable scrolledIndex: number | null = null;

	@observable isActive = false;

	@observable inputValue = '';

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
		this.isLoading = false;
	};

	@action
	fetchTokenResults = async (tokenString: string) => {
		const { timestampFrom, timestampTo } = this.eventsStore.filterStore.eventsFilter;
		const rootEventsResults = await this.api.events.getEventsByName(timestampFrom, timestampTo, tokenString);

		const expandedSubNodes = this.eventsStore.nodesList
			.filter(node => node.isExpanded && node.children && node.children.length > 0);

		const subNodesResult = await Promise.all(
			expandedSubNodes.map(node =>
				this.api.events.getEventsByName(timestampFrom, timestampTo, tokenString, node.id)),
		);

		return [...rootEventsResults, ...subNodesResult.flat(2)];
	};

	@action
	appendResultsForEvent = async (eventId: string) => {
		this.isLoading = true;
		const { timestampFrom, timestampTo } = this.eventsStore.filterStore.eventsFilter;
		const results = await Promise.all(
			this.tokens.map(token =>
				this.api.events.getEventsByName(timestampFrom, timestampTo, token.pattern, eventId)),
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

	@action
	private init = (initialState?: initialState) => {
		if (!initialState) return;
		const {
			isLoading = defaultState.isLoading,
			rawResults = defaultState.rawResults,
			scrolledIndex = defaultState.scrolledIndex,
			tokens = defaultState.tokens,
			searchPatterns,
		} = initialState;

		this.isLoading = isLoading;
		this.scrolledIndex = scrolledIndex;
		this.rawResults = rawResults;

		if (searchPatterns && searchPatterns.length) {
			const tokensFromUrl = searchPatterns.map((patt, index) =>
				createSearchToken(patt, SearchTokenColors[index], true, false));
			this.tokens = tokensFromUrl;
			this.updateTokens(tokensFromUrl);
			this.isActive = true;
		} else {
			this.tokens = tokens;
		}
	};

	@action
	setInputValue = (value: string) => {
		this.inputValue = value;
	};
}
