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

import { useEffect, useRef } from 'react';
import { Panel } from 'models/Panel';
import { useWorkspaceViewStore } from './useWorkspaceViewStore';

export function useActivePanel(panel?: Panel) {
	const panelRef = useRef<HTMLDivElement>(null);

	const workspaceViewStore = useWorkspaceViewStore();

	useEffect(() => {
		function handlePanelClick(e: MouseEvent) {
			if (
				panel !== undefined &&
				panelRef.current &&
				e.target instanceof Node &&
				panelRef.current.contains(e.target)
			) {
				workspaceViewStore.setActivePanel(panel);
			}
		}
		document.addEventListener('click', handlePanelClick);

		return () => {
			document.removeEventListener('click', handlePanelClick);
		};
	}, [panel]);

	return {
		ref: panelRef,
		activePanel: workspaceViewStore.activePanel,
	};
}
