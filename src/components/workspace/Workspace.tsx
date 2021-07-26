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
import EventWindow from '../event/EventWindow';
import WorkspaceSplitter from './WorkspaceSplitter';
import MessagesWindow from '../message/MessagesWindow';
import { useActivePanel, useWorkspaceStore } from '../../hooks';
import { isEventsStore, isMessagesStore } from '../../helpers/stores';
import { useWorkspaceViewStore } from '../../hooks/useWorkspaceViewStore';
import '../../styles/workspace.scss';

const panelColors = {
	events: {
		default: '#F5C5A3',
		active: '#F7A76E',
	},
	messages: {
		default: '#ADE0EB',
		active: '#1AC4E5',
	},
} as const;

function Workspace() {
	const { activePanel } = useActivePanel(null);
	const { panelsLayout, setPanelsLayout } = useWorkspaceViewStore();
	const workspaceStore = useWorkspaceStore();

	return (
		<div className='workspace'>
			<WorkspaceSplitter
				panelsLayout={panelsLayout}
				setPanelsLayout={setPanelsLayout}
				panels={[
					{
						title: 'Events',
						color: panelColors.events,
						component: <EventWindow />,
						minWidth: 500,
						isActive: isEventsStore(activePanel),
						setActivePanel: () =>
							workspaceStore.viewStore.setActivePanel(workspaceStore.eventsStore),
					},
					{
						title: 'Messages',
						color: panelColors.messages,
						component: <MessagesWindow />,
						minWidth: 400,
						isActive: isMessagesStore(activePanel),
						setActivePanel: () =>
							workspaceStore.viewStore.setActivePanel(workspaceStore.messagesStore),
					},
				]}
			/>
		</div>
	);
}

export default observer(Workspace);
