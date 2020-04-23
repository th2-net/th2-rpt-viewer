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
import { MessageCardList } from './message/MessagesCardList';
import LogsList from './log/LogsList';
import { createStyleSelector } from '../helpers/styleCreators';
import { KnownBugPanel } from './knownbugs/KnownBugPanel';
import { useStores } from '../hooks/useStores';
import SplashScreen from './SplashScreen';
import '../styles/layout.scss';

const MIN_CONTROLS_WIDTH = 850;
const MIN_CONTROLS_WIDTH_WITH_REJECTED = 900;

type RightPanelType = Panel.MESSAGES | Panel.KNOWN_BUGS | Panel.LOGS;

export const RightPanel = observer(() => {
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
	const knownBugsRootClass = createStyleSelector(
		'layout-panel__content-wrapper',
		viewStore.rightPanel === Panel.KNOWN_BUGS ? null : 'disabled',
	);
	const logsRootClass = createStyleSelector(
		'layout-panel__content-wrapper',
		viewStore.rightPanel === Panel.LOGS ? null : 'disabled',
	);

	return (
		<div className="layout-panel" ref={root}>
			{eventsStore.isLoadingMessages
				? <SplashScreen />
				: <div className="layout-panel__content">
					<div className={messagesRootClass}>
						<MessageCardList />
					</div>
					<div className={logsRootClass}>
						<LogsList isActive={viewStore.rightPanel === Panel.LOGS}/>
					</div>
					<div className={knownBugsRootClass}>
						<KnownBugPanel/>
					</div>
				</div>}
		</div>
	);
});
