/** ****************************************************************************
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
import Header from './Header';
import SplitView from './SplitView';
import LeftPanel from './LeftPanel';
import RightPanel from './RightPanel';
import LinearProgressBar from './LinearProgressBar';
import NetworkError from './NetworkError';
import MessageCardList from './message/MessagesCardList';
import { Views } from '../stores/ViewStore';
import { useStores } from '../hooks/useStores';
import '../styles/layout.scss';
import SplashScreen from './SplashScreen';

const EventsLayout = () => {
	const { viewStore, messagesStore } = useStores();

	return (
		<div className="layout">
			<div className="layout__header">
				{!viewStore.isConnectionError && <LinearProgressBar progress={100} />}
				{viewStore.isConnectionError && <NetworkError />}
				<Header />
			</div>
			{viewStore.selectedView === Views.EVENTS
			&& <div className="layout__body">
				<SplitView
					panelArea={viewStore.panelArea}
					onPanelAreaChange={viewStore.setPanelArea}
					leftPanelMinWidth={500}
					rightPanelMinWidth={620}
					showMessages={viewStore.showMessages}>
					<LeftPanel />
					<RightPanel />
				</SplitView>
			</div>}
			{/* eslint-disable-next-line no-nested-ternary */}
			{viewStore.selectedView === Views.MESSAGES
				? messagesStore.isLoading
					? <SplashScreen />
					: <MessageCardList />
				: null}
		</div>
	);
};

export default observer(EventsLayout);
