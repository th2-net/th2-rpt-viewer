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
import { observer } from 'mobx-react-lite';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ToastProvider } from 'react-toast-notifications';
import Toast from './notifications/Toast';
import Notifier from './notifications/Notifier';
import { CustomDragLayer } from './drag-n-drop/CustomDragLayer';
import Graph from './graph/Graph';
import { useAppViewStore, useWindowsStore } from '../hooks';
import { EventsTab } from '../models/util/Windows';
import AppWindow from './AppWindow';
import SplitView from './split-view/SplitView';
import SplitViewPane from './split-view/SplitViewPane';
import '../styles/layout.scss';
import '../styles/root.scss';

const App = () => {
	const windowsStore = useWindowsStore();
	const appViewStore = useAppViewStore();
	const [activeEventsTab, setActiveEventsTab] = React.useState<EventsTab | null>(null);

	return (
		<div className='app'>
			<ToastProvider placement='top-right' components={{ Toast }} transitionDuration={0}>
				<Graph />
				<DndProvider backend={HTML5Backend}>
					<CustomDragLayer />
					<div className='app__workspaces'>
						{windowsStore.windows.length === 1 && (
							<AppWindow
								windowStore={windowsStore.windows[0]}
								windowIndex={0}
								activeEventsTab={activeEventsTab}
								setActiveEventsTab={setActiveEventsTab}
							/>
						)}
						{windowsStore.windows.length > 1 && (
							<SplitView
								panelArea={appViewStore.panelArea}
								onPanelAreaChange={appViewStore.setPanelArea}
								splitterClassName='app__workspaces-splitter'>
								<SplitViewPane>
									<AppWindow
										windowStore={windowsStore.windows[0]}
										windowIndex={0}
										activeEventsTab={activeEventsTab}
										setActiveEventsTab={setActiveEventsTab}
									/>
								</SplitViewPane>
								<SplitViewPane>
									<AppWindow
										windowStore={windowsStore.windows[1]}
										windowIndex={1}
										activeEventsTab={activeEventsTab}
										setActiveEventsTab={setActiveEventsTab}
									/>
								</SplitViewPane>
							</SplitView>
						)}
					</div>
				</DndProvider>
				<Notifier />
			</ToastProvider>
		</div>
	);
};

export default hot(observer(App));
