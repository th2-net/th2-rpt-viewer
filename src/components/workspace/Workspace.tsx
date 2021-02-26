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
import { useActivePanel, useActiveWorkspace } from '../../hooks';
import { isEventsStore, isMessagesStore } from '../../helpers/stores';
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
	const activeWorkspace = useActiveWorkspace();

	const [eventsRange, setEventsRange] = React.useState([0, 0]);
	const [messagesRange, setMessagesRange] = React.useState([0, 0]);
	const [isEventsIndicated, setEventsIndicated] = React.useState(false);
	const [isMessagesIndicated, setMessagesIndicated] = React.useState(false);
	const eventsTimer = React.useRef<NodeJS.Timeout>();
	const messagesTimer = React.useRef<NodeJS.Timeout>();

	React.useEffect(() => {
		const range = activeWorkspace.eventsStore.panelRange;
		if (eventsRange[0] !== range[0] || eventsRange[1] !== range[1]) {
			setEventsIndicated(true);
			setEventsRange(range);

			eventsTimer.current = setTimeout(() => {
				setEventsIndicated(false);
			}, 400);
		}

		return () => {
			if (eventsTimer.current) {
				window.clearTimeout(eventsTimer.current);
			}
		};
	}, [activeWorkspace.eventsStore.panelRange]);

	React.useEffect(() => {
		const range = activeWorkspace.messagesStore.panelRange;
		if (messagesRange[0] !== range[0] || messagesRange[1] !== range[1]) {
			setMessagesIndicated(true);
			setMessagesRange(range);

			messagesTimer.current = setTimeout(() => {
				setMessagesIndicated(false);
			}, 400);
		}

		return () => {
			if (messagesTimer.current) {
				window.clearTimeout(messagesTimer.current);
			}
		};
	}, [activeWorkspace.messagesStore.panelRange]);

	return (
		<div className='workspace'>
			<WorkspaceSplitter
				panels={[
					{
						title: 'Events',
						color: panelColors.events,
						component: <EventWindow />,
						minWidth: 500,
						isActive: isEventsStore(activePanel) || isEventsIndicated,
					},
					{
						title: 'Messages',
						color: panelColors.messages,
						component: <MessagesWindow />,
						minWidth: 400,
						isActive: isMessagesStore(activePanel) || isMessagesIndicated,
					},
				]}
			/>
		</div>
	);
}

export default observer(Workspace);
