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

import { action, computed, IReactionDisposer, observable, reaction, runInAction } from 'mobx';
import debounce from 'lodash.debounce';
import SearchWorker from '../../search.worker';
import SearchToken from '../../models/search/SearchToken';
import ApiSchema from '../../api/ApiSchema';
import { createSearchToken } from '../../helpers/search/createSearchToken';
import { COLORS as SearchTokenColors } from '../../components/search/SearchInput';
import { nextCyclicItemByIndex } from '../../helpers/array';
import EventsFilter from '../../models/filter/EventsFilter';
import { ExperimentalAPIEventStore } from '../../components/event/experimental-api/ExperimentalAPIEventStore';

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
		private eventsStore: ExperimentalAPIEventStore,
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

	private searchResultsUpdateReaction: IReactionDisposer | null = null;

	private worker: typeof SearchWorker | null = null;

	@action
	public fetchSearchResults = async (searchTokens: SearchToken[]) => {
		this.rawResults = [];
		this.scrolledIndex = null;

		if (this.searchResultsUpdateReaction) {
			this.searchResultsUpdateReaction();
		}

		if (searchTokens.length === 0) return;

		runInAction(() => (this.isLoadingSearchResults = true));
		try {
			const ids = await this.api.events.getChildrenIds({
				limit: 1000,
				name: this.getSearchFilter(searchTokens)?.name.values,
			});
			runInAction(() => {
				this.rawResults = ids || [];
				this.isLoadingSearchResults = false;
			});
		} catch (error) {
			runInAction(() => {
				this.isLoadingSearchResults = false;
				this.resetState();
			});
		}

		const results = this.eventsStore.tree.filter(node => this.rawResults.includes(node));

		const currentIndex = this.currentEventId ? results.indexOf(this.currentEventId) : null;

		this.scrolledIndex = currentIndex;
		this.results = results;

		this.isProccessingSearchResults = false;
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
}
