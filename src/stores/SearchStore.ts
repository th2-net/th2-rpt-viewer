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

import { action, observable } from 'mobx';
import SearchToken from '../models/search/SearchToken';
import SearchResult from '../helpers/search/SearchResult';

export class SearchStore {
	@observable tokens: SearchToken[] = [];

	@observable results: SearchResult = new SearchResult();

	@observable resultsCount = 0;

	@observable index: number | null = null;

	@observable shouldScrollToItem = false;

	@observable leftPanelEnabled = true;

	@observable rightPanelEnabled = true;

	@action
	setSearchTokens = (searchTokens: SearchToken[]) => {
		this.tokens = searchTokens;
		this.resultsCount = 0;
		this.index = null;
	};

	@action
	nextSearchResult = () => {
		const targetIndex = this.index != null
			? (this.index + 1) % this.resultsCount : 0;
		this.index = targetIndex;
		this.shouldScrollToItem = true;
	};

	@action
	prevSearchResult = () => {
		const targetIndex = this.index != null
			? (this.resultsCount + this.index - 1) % this.resultsCount
			: this.resultsCount - 1;
		this.index = targetIndex;
		this.shouldScrollToItem = true;
	};

	@action
	clear = () => {
		this.tokens = [];
		this.results = new SearchResult();
		this.index = null;
		this.resultsCount = 0;
		this.leftPanelEnabled = true;
		this.rightPanelEnabled = true;
		this.shouldScrollToItem = false;
	};
}

const searchStore = new SearchStore();

export default searchStore;
