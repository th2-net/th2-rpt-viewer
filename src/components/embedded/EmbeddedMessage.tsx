/** ****************************************************************************
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
import { EventMessage, MessageViewType, MessageViewTypeConfig } from '../../models/EventMessage';
import MessageCardBase from '../message/message-card/MessageCardBase';
import SplashScreen from '../SplashScreen';
import MessageExpandButton from '../message/MessageExpandButton';
import useElementSize from '../../hooks/useElementSize';
import CardDisplayType, { COLLAPSED_MESSAGES_WIDTH } from '../../util/CardDisplayType';

function EmbeddedMessage({ messageId }: { messageId: string }) {
	const [message, setMessage] = useState<EventMessage | null>();
	const [errorStatus, setErrorStatus] = useState<string | null>(null);
	const [viewType, setViewType] = useState(MessageViewType.JSON);
	const [rawViewType, setRawViewType] = useState(MessageViewType.ASCII);
	const [isExpanded, setIsExpanded] = React.useState(true);
	const [wrapperContent, setWrapperContent] = React.useState<HTMLDivElement | null>(null);

	const wrapperWidth = useElementSize(wrapperContent)?.width;

	const displayType = React.useMemo(
		() =>
			wrapperWidth && wrapperWidth < COLLAPSED_MESSAGES_WIDTH
				? CardDisplayType.MINIMAL
				: CardDisplayType.FULL,
		[wrapperWidth],
	);

	const viewTypeConfig: MessageViewTypeConfig = {
		viewType,
		setViewType,
	};

	const rawViewTypeConfig: MessageViewTypeConfig = {
		viewType: rawViewType,
		setViewType: setRawViewType,
	};

	useEffect(() => {
		getMessage();
	}, []);

	async function getMessage() {
		const res = await fetch(`backend/message/${messageId}`);
		if (res.ok) {
			setMessage(await res.json());
		} else {
			setErrorStatus(`${res.status} ${res.statusText}`);
		}
	}

	const handleWrapperRef = React.useCallback(ref => {
		setWrapperContent(ref);
	}, []);

	if (errorStatus) {
		throw new Error(errorStatus);
	}

	if (message) {
		return (
			<div className='embedded-wrapper' ref={handleWrapperRef}>
				<div className='messages-list__item'>
					<MessageCardBase
						message={message}
						displayType={displayType}
						viewTypeConfig={viewTypeConfig}
						rawViewTypeConfig={rawViewTypeConfig}
						isExpanded={isExpanded}
						isDisplayRuleRaw={false}
						isEmbedded={true}
					/>
					<MessageExpandButton
						isExpanded={isExpanded}
						isScreenshotMsg={false}
						isDisplayRuleRaw={false}
						setExpanded={setIsExpanded}
						parsedMessages={message.parsedMessages}
					/>
				</div>
			</div>
		);
	}

	return <SplashScreen />;
}

export default EmbeddedMessage;
