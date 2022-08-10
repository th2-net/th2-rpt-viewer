/** *****************************************************************************
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
 *  limitations under the License.
 ***************************************************************************** */

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useBooksStore } from '../hooks/useBooksStore';

interface EventsScopeContextState {
	bookId: string;
	scope: string;
}

export const EventsScopeContext = React.createContext<EventsScopeContextState>(
	{} as EventsScopeContextState,
);

type Props = React.PropsWithChildren<{
	scope: string;
}>;

export const EventsScopeProvider = observer((props: Props) => {
	const { scope, children } = props;
	const booksStore = useBooksStore();

	const state: EventsScopeContextState = React.useMemo(() => {
		return {
			scope,
			bookId: booksStore.selectedBook.name,
		};
	}, [scope, booksStore.selectedBook.name]);

	return <EventsScopeContext.Provider value={state}>{children}</EventsScopeContext.Provider>;
});

EventsScopeProvider.displayName = 'EventsScopeProvider';
