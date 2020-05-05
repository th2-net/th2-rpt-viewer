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
import ResizeObserver from 'resize-observer-polyfill';
import Panel from '../util/Panel';
import VerificationCard from './action/VerificationCard';
import EventCard from './event/EventCard';
import { createStyleSelector } from '../helpers/styleCreators';
import { useStores } from '../hooks/useStores';
import { EventAction } from '../models/EventAction';
import '../styles/layout.scss';

const MIN_CONTROLS_WIDTH = 850;
const MIN_CONTROLS_WIDTH_WITH_REJECTED = 900;

const RightPanel = () => {
	const { viewStore, selectedStore, eventsStore } = useStores();
	const [showTitles, setShowTitle] = React.useState(true);

	const root = React.useRef<HTMLDivElement>(null);

	const rootResizeObserver = React.useRef<ResizeObserver>(new ResizeObserver(elements => {
		const minWidth = selectedStore.rejectedMessages.length > 0
			? MIN_CONTROLS_WIDTH_WITH_REJECTED : MIN_CONTROLS_WIDTH;
		const shouldShowTitles = elements[0]?.contentRect.width > minWidth;

		if (showTitles !== shouldShowTitles) {
			setShowTitle(shouldShowTitles);
		}
	}));


	React.useEffect(() => {
		if (root.current) {
			rootResizeObserver.current.observe(root.current);
		}
		return () => {
			rootResizeObserver.current.unobserve(root.current as Element);
		};
	}, []);

	const messagesRootClass = createStyleSelector(
		'layout-panel__content-wrapper',
		viewStore.rightPanel === Panel.MESSAGES ? null : 'disabled',
	);

	const renderSelectedElement = (event: EventAction) => {
		if (!event) return null;
		return (
			<div style={{ overflow: 'auto', height: '100%' }}>
				{event.body && event.body.type === 'verification'
					? <VerificationCard
						key={event.eventId}
						verification={event}
						isSelected={true}
						isTransparent={false}
						parentActionId={event.parentEventId as any} />
					: <EventCard
						key={event.eventId}
						event={event}
						panelArea={viewStore.panelArea}
						onSelect={eventsStore.selectEvent} />
				}
			</div>);
	};
	return (
		<div className="layout-panel" ref={root}>
			<div className="layout-panel__content">
				<div className={messagesRootClass}>
					{eventsStore.selectedEvent
					&& renderSelectedElement(eventsStore.selectedEvent)}
				</div>
			</div>
		</div>
	);
};

export default observer(RightPanel);
