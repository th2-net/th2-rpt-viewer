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
import WindowsStore from '../stores/WindowsStore';
import ApiSchema from '../api/ApiSchema';
import AppViewStore from '../stores/AppViewStore';

export interface RootStoreContext {
    windowsStore: WindowsStore;
    appViewStore: AppViewStore;
}

const StoresContext = React.createContext({} as RootStoreContext);

export function createStores(api: ApiSchema): RootStoreContext {
	const appViewStore = new AppViewStore();
	const windowsStore = new WindowsStore(api);

	const stores = {
		appViewStore,
		windowsStore,
	};

	return stores;
}

export default StoresContext;
