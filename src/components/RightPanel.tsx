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
import { ToggleButton } from './ToggleButton';
import { MessageCardList } from './message/MessagesCardList';
import LogsList, { LogListActions } from './log/LogsList';
import { createBemElement, createStyleSelector } from '../helpers/styleCreators';
import { KnownBugPanel } from './knownbugs/KnownBugPanel';
import MessagePanelControl from './message/MessagePanelControls';
import { useStores } from '../hooks/useStores';
import '../styles/layout.scss';

const MIN_CONTROLS_WIDTH = 850;
const MIN_CONTROLS_WIDTH_WITH_REJECTED = 900;

type RightPanelType = Panel.MESSAGES | Panel.KNOWN_BUGS | Panel.LOGS;

export const RightPanel = observer(() => {
	const { viewStore, selectedStore } = useStores();
	const [showTitles, setShowTitle] = React.useState(true);

	const logsPanel = React.useRef<LogListActions>();
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

	const scrollPanelToTop = (panel: Panel) => {
		switch (panel) {
		case (Panel.LOGS): {
				logsPanel.current?.scrollToTop();
				break;
		}

		default:
		}
	};

	const logChipClassName = createBemElement(
		'log-button',
		'chip',
		// eslint-disable-next-line no-nested-ternary
		selectedStore.testCase?.hasErrorLogs
			? 'error' : selectedStore.testCase?.hasWarnLogs
				? 'warning' : 'hidden',
	);
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

	const selectPanel = (panel: RightPanelType) => {
		if (panel === viewStore.rightPanel) {
			scrollPanelToTop(panel);
		} else {
			viewStore.setRightPane(panel);
		}
	};

	const getCurrentPanelControls = () => {
		switch (viewStore.rightPanel) {
		case Panel.MESSAGES: {
			return <MessagePanelControl showTitles={showTitles}/>;
		}

		default: {
			return null;
		}
		}
	};

	return (
		<div className="layout-panel" ref={root}>
			<div className="layout-panel__controls">
				<div className="layout-panel__tabs">
					<ToggleButton
						isToggled={viewStore.rightPanel === Panel.MESSAGES}
						onClick={() => selectPanel(Panel.MESSAGES)}>
						Messages
					</ToggleButton>
					<ToggleButton
						isToggled={viewStore.rightPanel === Panel.KNOWN_BUGS}
						isDisabled={false}
						onClick={() => selectPanel(Panel.KNOWN_BUGS)}>
						Known bugs
					</ToggleButton>
					<ToggleButton
						isDisabled={false}
						isToggled={viewStore.rightPanel === Panel.LOGS}
						onClick={() => selectPanel(Panel.LOGS)}>
						<div className="log-button">
							<p>Logs</p>
							<div className={logChipClassName}/>
						</div>
					</ToggleButton>
				</div>
				{getCurrentPanelControls()}
			</div>
			<div className="layout-panel__content">
				<div className={messagesRootClass}>
					<MessageCardList />
				</div>
				<div className={logsRootClass}>
					<LogsList isActive={viewStore.rightPanel === Panel.LOGS}/>
				</div>
				<div className={knownBugsRootClass}>
					<KnownBugPanel/>
				</div>
			</div>
		</div>
	);
});
