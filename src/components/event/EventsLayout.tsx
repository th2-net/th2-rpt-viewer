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
 * limitations under the License.
 ***************************************************************************** */

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { CustomDragLayer } from '../drag-n-drop/CustomDragLayer';
import { useStores } from '../../hooks/useStores';
import SplitView from '../split-view/SplitView';
import AppWindow from '../AppWindow';
import '../../styles/layout.scss';

const EventsLayout = () => {
	const { windowsStore, appViewStore } = useStores();

	return (
		<DndProvider backend={HTML5Backend}>
			<CustomDragLayer />
			<div className="events-layout">
				{
					windowsStore.windows.length === 1
						? <AppWindow
							moveTabToNewWindow={(tabIndex: number) => windowsStore.moveTab(0, 1, tabIndex, 0)}
							shouldWrap={windowsStore.windows.length === 1}
							windowStore={windowsStore.windows[0]} windowIndex={0}/>
						: <SplitView
							panelArea={appViewStore.panelArea}
							onPanelAreaChange={appViewStore.setPanelArea}
							splitterClassName="events-layout__splitter">
							{windowsStore.windows.map((w, index) =>
								<AppWindow
									moveTabToNewWindow={(tabIndex: number) => windowsStore.moveTab(0, 1, tabIndex, 0)}
									windowStore={w}
									key={`window-${index}`}
									windowIndex={index} />) as [React.ReactNode, React.ReactNode]}
						</SplitView>
				}
			</div>
		</DndProvider>

	);
};

export default observer(EventsLayout);
