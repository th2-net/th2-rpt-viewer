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

import { lazy, Suspense } from 'react';
import * as ReactDOM from 'react-dom';
import 'regenerator-runtime/runtime';
import 'core-js/stable';
import 'core-js/features/array/flat-map';
import 'core-js/features/array/flat';
import { ThemeProvider } from 'components/ThemeProvider';
import ErrorBoundary from './components/util/ErrorBoundary';
import { ViewMode, ViewModeProvider } from './components/ViewModeProvider';
import './styles/root.scss';

let App: React.LazyExoticComponent<() => JSX.Element>;

const viewModeParam = new URLSearchParams(window.location.search).get('viewMode');
const viewMode = Object.values(ViewMode).includes(viewModeParam as ViewMode)
	? (viewModeParam as ViewMode)
	: ViewMode.Full;

if (viewMode === ViewMode.Full) {
	App = lazy(() => import('./components/App'));
} else {
	App = lazy(() => import('./components/EmbeddedApp'));
}

ReactDOM.render(
	<ErrorBoundary>
		<Suspense
			fallback={
				<div className='app-loader'>
					<i />
				</div>
			}>
			<ViewModeProvider value={viewMode}>
				<ThemeProvider>
					<App />
				</ThemeProvider>
			</ViewModeProvider>
		</Suspense>
	</ErrorBoundary>,
	document.getElementById('index'),
);
