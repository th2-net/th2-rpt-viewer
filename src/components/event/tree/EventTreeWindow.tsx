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
import LeftPanel from '../../LeftPanel';
import EventTreeList from './EventTreeList';
import RightPanel from '../../RightPanel';
import EventDetailInfo from '../EventDetailInfo';
import Empty from '../../Empty';
import SplitView from '../../SplitView';
import { useEventWindowStore } from '../../../hooks/useEventWindowStore';
import { useEventWindowViewStore } from '../../../hooks/useEventWindowViewStore';

function EventTreeWindow() {
	const eventWindowStore = useEventWindowStore();
	const viewStore = useEventWindowViewStore();

	return (
		<SplitView
			panelArea={viewStore.panelArea}
			onPanelAreaChange={viewStore.setPanelArea}
			leftPanelMinWidth={500}
			rightPanelMinWidth={500}>
			<LeftPanel>
				<EventTreeList/>
			</LeftPanel>
			<RightPanel>
				<div className="layout-panel__content-wrapper">
					{
						eventWindowStore.selectedNode ? (
							<EventDetailInfo idNode={eventWindowStore.selectedNode}/>
						) : (
							<Empty description="Select event"/>
						)
					}
				</div>
			</RightPanel>
		</SplitView>
	);
}

export default observer(EventTreeWindow);
