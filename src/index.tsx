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
import App from './components/App';
import ErrorBoundary from './components/util/ErrorBoundary';
import StoresProvider from './components/StoresProvider';
import { registerFetchInterceptor } from './helpers/fetch-intercept';
import EmbeddedMessagePanel from './components/embedded/EmbeddedMessagePanel';
import EmbeddedApp from './components/embedded/EmbeddedApp';

registerFetchInterceptor();

const searchParams = new URLSearchParams(window.location.search);
const isEmbedded = searchParams.get('viewMode') === 'embedded';
const isEmbeddedMessagePanel = searchParams.get('viewMode') === 'embeddedMessagePanel';

ReactDOM.render(
	<ErrorBoundary>
		{isEmbedded && <EmbeddedApp />}
		{isEmbeddedMessagePanel && <EmbeddedMessagePanel />}
		{!isEmbeddedMessagePanel && !isEmbedded && (
			<StoresProvider>
				<App />
			</StoresProvider>
		)}
	</ErrorBoundary>,
	document.getElementById('index'),
);
