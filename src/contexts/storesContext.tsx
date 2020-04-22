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
import reportStore, { ReportStore } from '../stores/ReportStore';
import selectedStore, { SelectedStore } from '../stores/SelectedStore';
import viewStore, { ViewStore } from '../stores/ViewStore';
import mlStore, { MLStore } from '../stores/MachineLearningStore';
import filterStore, { FilterStore } from '../stores/FilterStore';
import searchStore, { SearchStore } from '../stores/SearchStore';

interface RootStoreContex {
	reportStore: ReportStore;
	selectedStore: SelectedStore;
	viewStore: ViewStore;
	mlStore: MLStore;
	filterStore: FilterStore;
	searchStore: SearchStore;
}

export const StoresContext = React.createContext({} as RootStoreContex);

export const StoreContextProvider = ({ children }: { children: React.ReactNode }) => (
	<StoresContext.Provider value={{
		reportStore,
		selectedStore,
		viewStore,
		mlStore,
		filterStore,
		searchStore,
	}}>
		{children}
	</StoresContext.Provider>
);
