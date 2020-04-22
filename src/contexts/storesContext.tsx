/** *****************************************************************************
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
 *  limitations under the License.
 ***************************************************************************** */

import React from 'react';
import ReportStore from '../stores/ReportStore';
import SelectedStore from '../stores/SelectedStore';
import ViewStore from '../stores/ViewStore';
import MLStore from '../stores/MachineLearningStore';
import FilterStore from '../stores/FilterStore';
import SearchStore from '../stores/SearchStore';
import EventsStore from '../stores/EventsStore';
import ApiSchema from '../api/ApiSchema';

export interface RootStoreContext {
    reportStore: ReportStore;
    selectedStore: SelectedStore;
    viewStore: ViewStore;
    mlStore: MLStore;
    filterStore: FilterStore;
	searchStore: SearchStore;
	eventsStore: EventsStore;
}

const StoresContext = React.createContext({} as RootStoreContext);

export function createStores(api: ApiSchema) {
	const selectedStore = new SelectedStore(api);
	const filterStore = new FilterStore(api);
	const searchStore = new SearchStore(api);
	const mlStore = new MLStore(api, selectedStore);
	const viewStore = new ViewStore(api);
	const reportStore = new ReportStore(api, viewStore);
	const eventsStore = new EventsStore(api);

	const stores = {
		reportStore,
		selectedStore,
		viewStore,
		mlStore,
		filterStore,
		searchStore,
		eventsStore,
	};

	return stores;
}

export default StoresContext;
