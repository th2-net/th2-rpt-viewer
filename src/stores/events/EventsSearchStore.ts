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

import { action, computed, observable, reaction, makeObservable } from 'mobx';
import SearchToken from '../../models/search/SearchToken';
import ApiSchema from '../../api/ApiSchema';
import EventsStore from './EventsStore';
import { createSearchToken } from '../../helpers/search/createSearchToken';
import { COLORS as SearchTokenColors } from '../../components/search/SearchInput';
import { nextCyclicItemByIndex } from '../../helpers/array';

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

export default class EventsSearchStore {
	constructor(
		private api: ApiSchema,
		private eventsStore: EventsStore,
		initialState?: initialState,
	) {
		makeObservable<EventsSearchStore, 'init'>(this, {
			tokens: observable,
			rawResults: observable,
			isLoading: observable,
			scrolledIndex: observable,
			isActive: observable,
			inputValue: observable,
			scrolledItem: computed,
			results: computed,
			updateTokens: action,
			fetchTokenResults: action,
			appendResultsForEvent: action,
			removeEventsResults: action,
			nextSearchResult: action,
			prevSearchResult: action,
			clear: action,
			init: action,
			setInputValue: action,
		});

		this.init(initialState);

		reaction(
			() => this.eventsStore.viewStore.flattenedListView,
			() => (this.scrolledIndex = null),
		);
	}

	public tokens: SearchToken[] = [];

	public rawResults: string[] = [];

	public isLoading = false;

	public scrolledIndex: number | null = null;

	public isActive = false;

	public inputValue = '';

	public get scrolledItem(): null | string {
		if (this.scrolledIndex == null) {
			return null;
		}
		return this.results[this.scrolledIndex];
	}

	public get results(): string[] {
		if (this.eventsStore.viewStore.flattenedListView) {
			return this.eventsStore.flattenedEventList
				.map(node => node.eventId)
				.filter(nodeId => this.rawResults.includes(nodeId));
		}
		return this.eventsStore.nodesList
			.map(node => node.eventId)
			.filter(nodeId => this.rawResults.includes(nodeId));
	}

	public updateTokens = async (nextTokens: SearchToken[]): Promise<void> => {
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

	public fetchTokenResults = async (tokenString: string): Promise<string[]> => {
		const rootEventsResults = await this.api.events.getEventsByName(
			[
				this.eventsStore.filterStore.filter.timestampFrom,
				this.eventsStore.filterStore.filter.timestampTo,
			],
			tokenString,
		);

		const expandedSubNodes = this.eventsStore.nodesList.filter(
			node => this.eventsStore.isExpandedMap.get(node.eventId) && node.childList.length > 0,
		);

		const subNodesResult = await Promise.all(
			expandedSubNodes.map(node =>
				this.api.events.getEventsByName(
					[
						this.eventsStore.filterStore.filter.timestampFrom,
						this.eventsStore.filterStore.filter.timestampTo,
					],
					tokenString,
					node.eventId,
				),
			),
		);

		return [...rootEventsResults, ...subNodesResult.flat(2)];
	};

	public appendResultsForEvent = async (eventId: string): Promise<void> => {
		this.isLoading = true;
		const results = await Promise.all(
			this.tokens.map(token =>
				this.api.events.getEventsByName(
					[
						this.eventsStore.filterStore.filter.timestampFrom,
						this.eventsStore.filterStore.filter.timestampTo,
					],
					token.pattern,
					eventId,
				),
			),
		);
		this.isLoading = false;
		this.scrolledIndex = null;

		this.rawResults.push(...new Set(results.flat()));
	};

	public removeEventsResults = (nodesIds: string[]): void => {
		this.rawResults = this.rawResults.filter(result => !nodesIds.includes(result));
		this.scrolledIndex = null;
	};

	public nextSearchResult = (): void => {
		this.scrolledIndex =
			this.scrolledIndex != null ? (this.scrolledIndex + 1) % this.results.length : 0;
	};

	public prevSearchResult = (): void => {
		this.scrolledIndex =
			this.scrolledIndex != null
				? (this.results.length + this.scrolledIndex - 1) % this.results.length
				: 0;
	};

	public clear = (): void => {
		this.rawResults = [];
		this.tokens = [];
		this.inputValue = '';
		this.scrolledIndex = null;
	};

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
				createSearchToken(patt, nextCyclicItemByIndex(SearchTokenColors, index - 1), true, false),
			);
			this.tokens = tokensFromUrl;
			this.updateTokens(tokensFromUrl);
			this.isActive = true;
		} else {
			this.tokens = tokens;
		}
	};

	public setInputValue = (value: string): void => {
		this.inputValue = value;
	};
}
