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

import { action, computed, IReactionDisposer, observable, reaction } from 'mobx';
import debounce from 'lodash.debounce';
import SearchWorker from '../search.worker';
import SearchToken from '../../../models/search/SearchToken';
import ApiSchema from '../../../api/ApiSchema';
import EventsStore from './EventsStore';
import { createSearchToken } from '../../../helpers/search/createSearchToken';
import { COLORS as SearchTokenColors } from '../components/search/SearchInput';
import { nextCyclicItemByIndex } from '../../../helpers/array';
import EventsFilter from '../models/EventsFilter';
import { EventTreeNode } from '../../../models/EventAction';
import EventsSSEChannel from '../../../stores/SSEChannel/EventsSSEChannel';

const defaultState = {
	tokens: [],
	isLoading: false,
	scrolledIndex: null,
	rawResults: [],
};

type initialState = Partial<{
	tokens: SearchToken[];
	scrolledIndex: number | null;
	searchPatterns: string[];
}>;

export default class EventsSearchStore {
	constructor(
		private api: ApiSchema,
		private eventsStore: EventsStore,
		initialState?: initialState,
	) {
		this.init(initialState);

		reaction(
			() => this.eventsStore.viewStore.flattenedListView,
			() => (this.scrolledIndex = null),
		);
	}

	@observable
	public tokens: SearchToken[] = [];

	@observable
	public rawResults: string[] = [];

	@observable
	public results: string[] = [];

	@observable
	public inputValue = '';

	@observable
	public currentEventId: string | null = null;

	@observable
	public scrolledIndex: number | null = null;

	@observable
	private isLoadingSearchResults = false;

	@observable
	private isProccessingSearchResults = false;

	@computed
	public get isLoading() {
		return this.isLoadingSearchResults || this.isProccessingSearchResults;
	}

	@action
	updateTokens = (nextTokens: SearchToken[]) => {
		if (
			nextTokens.some(
				nextToken => !this.tokens.map(t => t.pattern.trim()).includes(nextToken.pattern.trim()),
			)
		) {
			this.onSearchTokensUpdate(nextTokens);
		}

		this.tokens = nextTokens;
	};

	@action
	nextSearchResult = () => {
		const nextIndex =
			this.scrolledIndex != null ? (this.scrolledIndex + 1) % this.results.length : 0;
		this.scrolledIndex = nextIndex;
		this.currentEventId = this.results[nextIndex];
		this.eventsStore.scrollToEvent(this.currentEventId);
	};

	@action
	prevSearchResult = () => {
		const prevIndex =
			this.scrolledIndex != null
				? (this.results.length + this.scrolledIndex - 1) % this.results.length
				: 0;
		this.scrolledIndex = prevIndex;
		this.currentEventId = this.results[prevIndex];
		this.eventsStore.scrollToEvent(this.currentEventId);
	};

	@action
	clear = () => {
		this.resetState();
	};

	@action
	private init = (initialState?: initialState) => {
		if (!initialState) return;
		const {
			scrolledIndex = defaultState.scrolledIndex,
			tokens = defaultState.tokens,
			searchPatterns,
		} = initialState;

		this.scrolledIndex = scrolledIndex;

		if (searchPatterns && searchPatterns.length) {
			const tokensFromUrl = searchPatterns.map((patt, index) =>
				createSearchToken(patt, nextCyclicItemByIndex(SearchTokenColors, index - 1), true, false),
			);
			this.tokens = tokensFromUrl;
			this.updateTokens(tokensFromUrl);
		} else {
			this.tokens = tokens;
		}
	};

	@action
	setInputValue = (value: string) => {
		this.inputValue = value;
	};

	private getSearchFilter = (searchTokens: SearchToken[]) => {
		const filter: EventsFilter | null = this.eventsStore.filterStore.filter
			? {
					...this.eventsStore.filterStore.filter,
					name: {
						...this.eventsStore.filterStore.filter.name,
						negative: false,
						values: searchTokens.map(token => token.pattern),
					},
			  }
			: null;

		return filter;
	};

	private channel: EventsSSEChannel | null = null;

	private searchResultsUpdateReaction: IReactionDisposer | null = null;

	private worker: typeof SearchWorker | null = null;

	@action
	public fetchSearchResults = (searchTokens: SearchToken[]) => {
		this.channel?.stop();
		this.worker?.terminate();
		this.rawResults = [];
		this.scrolledIndex = null;

		if (this.searchResultsUpdateReaction) {
			this.searchResultsUpdateReaction();
		}

		if (searchTokens.length === 0) return;

		this.isLoadingSearchResults = true;

		this.channel = new EventsSSEChannel(
			{
				filter: this.getSearchFilter(searchTokens),
				sseParams: {
					searchDirection: 'next',
				},
				timeRange: this.eventsStore.filterStore.range,
			},
			{
				onError: this.onSearchError,
				onResponse: this.onSearchResultsResponse,
				onClose: this.onClose,
			},
		);

		this.worker = new SearchWorker();

		this.worker.onmessage = this.onSearchResultsUpdateWorker;

		this.searchResultsUpdateReaction = reaction(
			() =>
				[
					this.rawResults,
					this.eventsStore.viewStore.flattenedListView
						? this.eventsStore.flattenedEventList
						: this.eventsStore.flatExpandedList,
				] as [string[], EventTreeNode[]],
			([rawResults, nodes]) => {
				this.isProccessingSearchResults = Boolean(rawResults.length > 0 && nodes.length > 0);

				this.onSearchDataUpdate(rawResults, nodes);
			},
		);

		this.channel.subscribe();
	};

	@action
	private onSearchResultsResponse = (events: EventTreeNode[]) => {
		this.rawResults = [...this.rawResults, ...events.map(event => event.eventId)];
	};

	private onSearchError = () => {
		this.resetState();
	};

	@action
	private onSearchResultsUpdateWorker = (e: MessageEvent) => {
		const { results, currentIndex } = e.data;
		this.scrolledIndex = currentIndex;
		this.results = results;

		this.isProccessingSearchResults = false;
	};

	@action
	private onClose = (events: EventTreeNode[]) => {
		this.onSearchResultsResponse(events);
		this.isLoadingSearchResults = false;
	};

	public dispose = () => {
		this.resetState();
	};

	@action
	private resetState = () => {
		this.isLoadingSearchResults = false;
		this.isProccessingSearchResults = false;
		this.scrolledIndex = null;
		this.currentEventId = null;
		this.results = [];
		this.rawResults = [];

		this.channel?.stop();
		this.channel = null;

		if (this.searchResultsUpdateReaction) {
			this.searchResultsUpdateReaction();
		}

		this.worker?.terminate();
		this.worker = null;
	};

	private onSearchTokensUpdate = (searchTokens: SearchToken[]) => {
		this.isProccessingSearchResults = Boolean(searchTokens.length);

		if (searchTokens.length !== 0) {
			this.debouncedFetchSearchResults(searchTokens);
		} else {
			this.resetState();
		}
	};

	private debouncedFetchSearchResults = debounce(this.fetchSearchResults, 650);

	public onFilterChange = () => {
		this.resetState();
		this.fetchSearchResults(this.tokens);
	};

	private onSearchDataUpdate = debounce((rawResults: string[], nodes: EventTreeNode[]) => {
		this.worker?.postMessage({
			rawResults: rawResults.slice(),
			nodes: nodes.slice(),
			currentEventId: this.currentEventId,
		});
	}, 600);
}
