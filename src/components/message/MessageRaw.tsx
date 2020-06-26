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
import { observer } from 'mobx-react-lite';
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';
import DetailedMessageRaw from './DetailedMessageRaw';
import SimpleMessageRaw from './SimpleMessageRaw';
import { createBemElement } from '../../helpers/styleCreators';
import { decodeBase64RawContent, getAllRawContent } from '../../helpers/rawFormatter';
import { copyTextToClipboard } from '../../helpers/copyHandler';
import { showNotification } from '../../helpers/showNotification';

const COPY_NOTIFICATION_TEXT = 'Text copied to the clipboard!';

interface Props {
	rawContent: string;
	messageId: string;
}

function MessageRaw({ rawContent, messageId }: Props) {
	const messagesStore = useMessagesWindowStore();

	const isDetailed = messagesStore.detailedRawMessagesIds.includes(messageId);
	const displayIconClass = createBemElement(
		'mc-raw',
		'display-btn',
		isDetailed ? 'active' : null,
	);

	const copyAll = () => {
		const copyContent = isDetailed
			? getAllRawContent(decodeBase64RawContent(rawContent))
			: atob(rawContent);

		copyTextToClipboard(copyContent);
		showNotification(COPY_NOTIFICATION_TEXT);
	};

	return (
		<div className="mc-raw">
			<div className="mc-raw__header">
				<div className="mc-raw__title">Raw message</div>
				<div className="mc-raw__copy-all"
					 onClick={copyAll}
					 title="Copy all raw content to clipboard">
					<div className="mc-raw__copy-icon"/>
					<div className="mc-raw__copy-title">
						<span>Copy All</span>
					</div>
				</div>
				<div
					className={displayIconClass}
					onClick={() => messagesStore.toggleMessageDetailedRaw(messageId)}
					title={`Switch to ${isDetailed ? 'simplified' : 'detailed'} view`}/>
			</div>
			{
				isDetailed
					? <DetailedMessageRaw rawContent={rawContent}/>
					: <SimpleMessageRaw rawContent={rawContent}/>
			}
		</div>
	);
}

export default observer(MessageRaw);
