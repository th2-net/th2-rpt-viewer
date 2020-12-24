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
import EventWindow from './event/EventWindow';
import BookmarksPanel from './BookmarksPanel';
import WorkspaceSplitter from './WorkspaceSplitter';
import MessagesWindow from './message/MessagesWindow';
import '../styles/workspace.scss';
import { useWorkspaceViewStore } from '../hooks/useWorkspaceViewStore';

interface WorkspaceProps {
	isActive: boolean;
}

function Workspace(props: WorkspaceProps) {
	const viewStore = useWorkspaceViewStore();

	return (
		<div className='workspace'>
			<WorkspaceSplitter
				panels={[
					{
						title: 'Events',
						color: '#F5C5A3',
						component: <EventWindow isActive={props.isActive} />,
						minWidth: 500,
					},
					{
						title: 'Messages',
						color: '#1AC4E5',
						component: <MessagesWindow />,
						minWidth: 400,
					},
					{
						title: 'Search',
						color: '#ADC2EB',
						component: (
							<div onClick={() => viewStore.setTargetPanel(null)} style={{ margin: 'auto' }}>
								Search
							</div>
						),
					},
					{
						title: 'Bookmarks',
						color: '#CCADEB',
						component: <BookmarksPanel />,
					},
				]}
			/>
		</div>
	);
}

export default Workspace;
