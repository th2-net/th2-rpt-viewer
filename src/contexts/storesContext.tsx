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
import ApiSchema from "../api/ApiSchema";
import EventsStore from "../stores/EventsStore";

export interface RootStoreContext {
    reportStore: ReportStore;
    selectedStore: SelectedStore;
    viewStore: ViewStore;
    mlStore: MLStore;
    filterStore: FilterStore;
    searchStore: SearchStore;
    eventStore: EventsStore;
}

const StoresContext = React.createContext({} as RootStoreContext);

export function createStores(api: ApiSchema) {
    const selectedStore = new SelectedStore(api),
        filterStore = new FilterStore(api),
        searchStore = new SearchStore(api),
        mlStore = new MLStore(api, selectedStore),
        viewStore = new ViewStore(api),
        reportStore = new ReportStore(api, viewStore),
        eventStore = new EventsStore(api);

    eventStore.init();

    const stores = {
        reportStore,
        selectedStore,
        viewStore,
        mlStore,
        filterStore,
        searchStore,
        eventStore
    };

    return stores;
}

export default StoresContext;
