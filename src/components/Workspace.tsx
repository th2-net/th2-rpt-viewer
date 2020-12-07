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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import SplitView from './split-view/SplitView';
import SplitViewPane from './split-view/SplitViewPane';
import EventWindow from './event/EventWindow';
// import MessagesWindow from './message/MessagesWindow';
import { useWorkspaceStore } from '../hooks';
import '../styles/workspace.scss';
import BookmarksPanel from './BookmarksPanel';

function Workspace() {
	const workspaceStore = useWorkspaceStore();

	return (
		<div className='workspace'>
			<SplitView
				panelArea={workspaceStore.viewStore.panelArea}
				onPanelAreaChange={workspaceStore.viewStore.setPanelArea}
				splitterClassName='app__workspaces-splitter'>
				<SplitViewPane>
					<EventWindow isActive={false} />
				</SplitViewPane>
				<SplitViewPane>
					{/* <MessagesWindow /> */}
					<BookmarksPanel />
				</SplitViewPane>
			</SplitView>
		</div>
	);
}

export default observer(Workspace);
