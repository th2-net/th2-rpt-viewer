/** ****************************************************************************
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

import { hot } from 'react-hot-loader/root';
import * as React from 'react';
import { ToastProvider } from 'react-toast-notifications';
import Toast from './notifications/Toast';
import Notifier from './notifications/Notifier';
import WorkspacesLayout from './workspace/WorkspacesLayout';
import '../styles/root.scss';
// eslint-disable-next-line import/no-named-default
import { default as Graph } from './graph/Graph';

const App = () => (
	<div className='app'>
		<ToastProvider placement='top-right' components={{ Toast }} transitionDuration={400}>
			<Graph />
			<div className='app__workspaces'>
				<WorkspacesLayout />
			</div>
			<Notifier />
		</ToastProvider>
	</div>
);

export default hot(App);
