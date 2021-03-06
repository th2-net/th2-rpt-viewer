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

import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { useMessagesWorkspaceStore } from '../../../../hooks';
import DetailedMessageRaw from './DetailedMessageRaw';
import SimpleMessageRaw from './SimpleMessageRaw';

interface Props {
	rawContent: string;
	messageId: string;
	renderInfo: () => React.ReactNode;
}

function MessageRaw({ rawContent, messageId, renderInfo }: Props) {
	const messagesStore = useMessagesWorkspaceStore();

	const isDetailed = messagesStore.detailedRawMessagesIds.includes(messageId);

	return (
		<div className='mc-raw'>
			{isDetailed ? (
				<DetailedMessageRaw rawContent={rawContent} />
			) : (
				<SimpleMessageRaw rawContent={rawContent} renderInfo={renderInfo} />
			)}
		</div>
	);
}

export default observer(MessageRaw);
