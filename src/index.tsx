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
 * limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import 'regenerator-runtime/runtime';
import 'core-js/stable';
import 'core-js/features/array/flat-map';
import 'core-js/features/array/flat';
import ErrorBoundary from './components/util/ErrorBoundary';
import { registerFetchInterceptor } from './helpers/fetch-intercept';
import { ViewMode, ViewModeProvider } from './contexts/viewModeContext';

registerFetchInterceptor();

const searchParams = new URLSearchParams(window.location.search);

let App: React.LazyExoticComponent<() => JSX.Element>;

if (searchParams.get('viewMode') === 'embedded') {
	App = React.lazy(() => import('./components/embedded/EmbeddedApp'));
} else if (searchParams.get('viewMode') === 'embeddedMessages') {
	App = React.lazy(() => import('./components/embedded/EmbeddedMessages'));
} else {
	App = React.lazy(() => import('./components/App'));
}

const viewModeParam = searchParams.get('viewMode');
const viewMode = (viewModeParam === null ? ViewMode.Full : viewModeParam) as ViewMode;

ReactDOM.render(
	<ErrorBoundary>
		<React.Suspense fallback={<div>Loading...</div>}>
			<ViewModeProvider value={viewMode}>
				<App />
			</ViewModeProvider>
		</React.Suspense>
	</ErrorBoundary>,
	document.getElementById('index'),
);
