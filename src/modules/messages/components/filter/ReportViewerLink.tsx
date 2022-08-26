/** *****************************************************************************
 * Copyright 2022-2022 Exactpro (Exactpro Systems Limited)
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

import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useMessagesStore } from '../../hooks/useMessagesStore';

const ReportViewerLink = observer(() => {
	const messagesStore = useMessagesStore();

	const reportURL = useMemo(() => {
		const messagesStoreState = {
			timestampFrom: messagesStore.filterStore.params.timestampFrom,
			timestampTo: messagesStore.filterStore.params.timestampTo,
			streams: messagesStore.filterStore.params.streams,
			sse: messagesStore.filterStore.sseMessagesFilter,
			isSoftFilter: false,
		};

		const searchString = new URLSearchParams({
			workspaces: window.btoa(
				JSON.stringify([
					{
						messages: messagesStoreState,
					},
				]),
			),
		});

		return [window.location.origin, window.location.pathname, `?${searchString}`].join('');
	}, [messagesStore.filterStore.params, messagesStore.filterStore.sseMessagesFilter]);

	return (
		<a href={reportURL} rel='noreferrer' target='_blank' className='report-viewer-link'>
			Report viewer
		</a>
	);
});

export default ReportViewerLink;
