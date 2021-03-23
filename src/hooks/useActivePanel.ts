/* eslint-disable react/no-children-prop */
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

import React, { useEffect, useRef } from 'react';
import EventsStore from '../stores/events/EventsStore';
import MessagesStore from '../stores/messages/MessagesStore';
import { useWorkspaceViewStore } from './useWorkspaceViewStore';

export function useActivePanel(
	panel: EventsStore | MessagesStore | null = null,
): {
	ref: React.RefObject<HTMLDivElement>;
	activePanel: EventsStore | MessagesStore | null;
} {
	const panelRef = useRef<HTMLDivElement>(null);

	const workspaceViewStore = useWorkspaceViewStore();

	function handlePanelClick(e: MouseEvent) {
		if (panelRef.current && e.target instanceof Node && panelRef.current.contains(e.target)) {
			workspaceViewStore.setActivePanel(panel);
		}
	}

	useEffect(() => {
		document.addEventListener('click', handlePanelClick);

		return () => {
			document.removeEventListener('click', handlePanelClick);
		};
	}, []);

	return {
		ref: panelRef,
		activePanel: workspaceViewStore.activePanel,
	};
}
