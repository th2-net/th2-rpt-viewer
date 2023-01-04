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

import React, { useCallback, useEffect, useState } from 'react';
import { EventMessage, MessageViewType } from 'models/EventMessage';
import SplashScreen from 'components/SplashScreen';
import useElementSize from 'hooks/useElementSize';
import CardDisplayType, { COLLAPSED_MESSAGES_WIDTH } from 'models/util/CardDisplayType';
import { getDefaultViewTypesMap } from '../helpers/message';
import MessageCard from '../components/message-card/MessageCard';

function EmbeddedMessage({ messageId }: { messageId: string }) {
	const [message, setMessage] = useState<EventMessage | null>();
	const [errorStatus, setErrorStatus] = useState<string | null>(null);
	const [viewType, setViewType] = useState<Map<string, MessageViewType>>(new Map());
	const [isExpanded, setIsExpanded] = useState(true);

	const updateViewType = useCallback((id: string, newViewType: MessageViewType) => {
		setViewType(vt => new Map(vt.set(id, newViewType)));
	}, []);

	const [wrapperContent, setWrapperContent] = React.useState<HTMLDivElement | null>(null);

	const wrapperWidth = useElementSize(wrapperContent)?.width;

	const displayType = React.useMemo(
		() =>
			wrapperWidth && wrapperWidth < COLLAPSED_MESSAGES_WIDTH
				? CardDisplayType.MINIMAL
				: CardDisplayType.FULL,
		[wrapperWidth],
	);

	useEffect(() => {
		async function getMessage() {
			const res = await fetch(`${process.env.BASE_URL}/message/${messageId}`);
			if (res.ok) {
				const msg = await res.json();
				setViewType(getDefaultViewTypesMap(msg));
				setMessage(msg);
			} else {
				setErrorStatus(`${res.status} ${res.statusText}`);
			}
		}

		getMessage();
	}, []);

	const handleWrapperRef = React.useCallback(ref => {
		setWrapperContent(ref);
	}, []);

	if (errorStatus) {
		throw new Error(errorStatus);
	}

	if (message) {
		return (
			<div className='embedded-message' ref={handleWrapperRef}>
				<MessageCard
					message={message}
					displayType={displayType}
					setViewType={updateViewType}
					viewTypesMap={viewType}
					isEmbedded={true}
					isExpanded={isExpanded}
					setIsExpanded={setIsExpanded}
				/>
			</div>
		);
	}

	return <SplashScreen />;
}

export default EmbeddedMessage;
