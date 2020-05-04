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
import EventList from './event/EventList';
import { useStores } from '../hooks/useStores';
import '../styles/layout.scss';
import SplashScreen from './SplashScreen';

const LeftPanel = () => {
	const { eventsStore } = useStores();

	return (
		<div className="layout-panel">
			<div className="layout-panel__content layout-events">
				{
					eventsStore.events.length > 0
						? <EventList events={eventsStore.events} />
						: <SplashScreen />
				}
			</div>
		</div>
	);
};

export default observer(LeftPanel);
