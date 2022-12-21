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
import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { copyTextToClipboard } from '../helpers/copyHandler';
import { useRootStore, useWorkspaces } from '../hooks';
import { isWorkspaceStore } from '../helpers/workspace';
import '../styles/workspace-link-getter.scss';

const WorkspaceLinkGetter = observer(() => {
	const workspacesStore = useWorkspaces();

	const [disabled, setDisabled] = useState(false);
	const rootStore = useRootStore();

	useEffect(() => {
		let timeout: NodeJS.Timeout;
		if (disabled) {
			timeout = setTimeout(() => {
				setDisabled(false);
			}, 3000);
		}
		return () => {
			clearTimeout(timeout);
		};
	}, [disabled]);

	function copyWorkspaceLink() {
		const appState = rootStore.getAppState();
		const params = appState
			? new URLSearchParams({
					workspaces: window.btoa(JSON.stringify(appState.workspaces)),
					bookId: appState.bookId || '',
			  })
			: null;

		if (params) {
			copyTextToClipboard(
				[window.location.origin, window.location.pathname, `?${params}`].join(''),
			);
			setDisabled(true);
		}
	}

	if (!isWorkspaceStore(workspacesStore.activeWorkspace)) {
		return null;
	}

	return (
		<button
			className='graph-button workspace-link-getter'
			disabled={disabled}
			onClick={copyWorkspaceLink}>
			{disabled ? 'Copied to clipboard' : 'Get Workspace Link'}
		</button>
	);
});

WorkspaceLinkGetter.displayName = 'WorkspaceLinkGetter';

export default WorkspaceLinkGetter;
