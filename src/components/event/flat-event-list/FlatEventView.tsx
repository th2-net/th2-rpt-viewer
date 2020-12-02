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
import { observer } from 'mobx-react-lite';
import SplitViewPane from '../../split-view/SplitViewPane';
import FlatEventList from './FlatEventList';
import Empty from '../../Empty';
import SplitView from '../../split-view/SplitView';
import { useEventWindowStore, useEventWindowViewStore } from '../../../hooks';
import DetailedFlatEventCard from './DetailedFlatEventCard';

function EventTreeView() {
	const eventWindowStore = useEventWindowStore();
	const viewStore = useEventWindowViewStore();

	return (
		<SplitView
			panelArea={viewStore.panelArea}
			onPanelAreaChange={viewStore.setPanelArea}
			leftPanelMinWidth={445}
			rightPanelMinWidth={445}>
			<SplitViewPane>
				<FlatEventList nodes={eventWindowStore.flattenedEventList} />
			</SplitViewPane>
			<SplitViewPane>
				{eventWindowStore.selectedNode === null &&
					!eventWindowStore.loadingSelectedEvent &&
					(eventWindowStore.eventTreeStatusCode === null ? (
						<Empty description='Select event' />
					) : (
						<Empty
							description={`Server responded with ${eventWindowStore.eventTreeStatusCode} code`}
						/>
					))}
				{eventWindowStore.selectedNode && (
					<DetailedFlatEventCard
						eventTreeNode={eventWindowStore.selectedNode}
						parentNodes={eventWindowStore.selectedPath.filter(
							node => node !== eventWindowStore.selectedNode,
						)}
					/>
				)}
			</SplitViewPane>
		</SplitView>
	);
}

export default observer(EventTreeView);
