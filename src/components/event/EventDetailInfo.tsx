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
import { EventAction } from '../../models/EventAction';
import VerificationCard from './VerificationCard';
import EventDetailCard from './EventDetailCard';
import PanelArea from '../../util/PanelArea';
import { EventIdNode } from '../../stores/EventWindowStore';
import useCachedEvent from '../../hooks/useCachedEvent';
import SplashScreen from '../SplashScreen';

interface Props {
	idNode: EventIdNode;
}

export default function EventDetailInfo({ idNode }: Props) {
	const event = useCachedEvent(idNode);

	if (!event) {
		return <SplashScreen/>;
	}

	return (
		<div style={{ overflow: 'auto', height: '100%' }}>
			{
				event.body && event.body.type === 'verification'
					? <VerificationCard
						key={event.eventId}
						verification={event}
						isSelected={true}
						isTransparent={false}
						parentActionId={event.parentEventId as any} />
					: <EventDetailCard
						key={event.eventId}
						event={event}
						panelArea={PanelArea.P50} />
			}
		</div>
	);
}
