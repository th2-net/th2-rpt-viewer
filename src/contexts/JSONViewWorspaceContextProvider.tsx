/** *****************************************************************************
 * Copyright 2020-2021 Exactpro (Exactpro Systems Limited)
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
import JSONViewerWorkspaceStore from '../stores/workspace/JSONViewerWorkspaceStore';

const JSONViewWorspaceContext = React.createContext<JSONViewerWorkspaceStore | null>(null);

interface WorkspaceContextProviderProps {
	children: React.ReactNode;
	value: JSONViewerWorkspaceStore;
}
const JSONViewWorspaceContextProvider = ({ children, value }: WorkspaceContextProviderProps) => (
	<JSONViewWorspaceContext.Provider value={value}>{children}</JSONViewWorspaceContext.Provider>
);

export { JSONViewWorspaceContext, JSONViewWorspaceContextProvider };
