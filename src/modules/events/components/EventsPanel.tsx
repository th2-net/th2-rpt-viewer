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

import { observer } from 'mobx-react-lite';
import { useActivePanel } from 'hooks/index';
import { Panel } from 'models/Panel';
import { useEventWindowViewStore } from '../hooks/useEventWindowViewStore';
import EventTreeView from './tree/EventTreeView';
import FlatEventView from './flat-event-list/FlatEventView';
import EventsPanelHeader from './EventsPanelHeader';
import 'styles/events.scss';

function EventsPanel() {
	const eventWindowViewStore = useEventWindowViewStore();

	const { ref: panelRef } = useActivePanel(Panel.Events);

	return (
		<div className='window' ref={panelRef}>
			<EventsPanelHeader />
			<div className='window__body'>
				{eventWindowViewStore.flattenedListView ? <FlatEventView /> : <EventTreeView />}
			</div>
		</div>
	);
}

export default observer(EventsPanel);