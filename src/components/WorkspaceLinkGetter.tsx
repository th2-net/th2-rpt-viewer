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
import { copyTextToClipboard } from '../helpers/copyHandler';
import localStorageWorker from '../util/LocalStorageWorker';
import '../styles/workspace-link-getter.scss';

const WorkspaceLinkGetter = () => {
	const [disabled, setDisabled] = useState(false);

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

	return (
		<button
			className='workspace-link-getter'
			disabled={disabled}
			onClick={() => {
				copyTextToClipboard(
					[
						window.location.origin,
						window.location.pathname,
						`?${localStorageWorker.getLastSearchQuery()}`,
					].join(''),
				);
				setDisabled(true);
			}}>
			{disabled ? 'Copied to clipboard' : 'Get Workspace Link'}
		</button>
	);
};

export default WorkspaceLinkGetter;
