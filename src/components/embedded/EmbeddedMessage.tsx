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
import { EventMessage, MessageViewType } from '../../models/EventMessage';
import { MessageCardBase } from '../message/message-card/MessageCardBase';
import SplashScreen from '../SplashScreen';
import '../../styles/embedded.scss';

function EmbeddedMessage({ messageId }: { messageId: string }) {
	const [message, setMessage] = useState<EventMessage | null>();
	const [viewType, setViewType] = useState(MessageViewType.JSON);
	const [errorStatus, setErrorStatus] = useState<string | null>(null);

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

	if (errorStatus) {
		throw new Error(errorStatus);
	}

	if (message) {
		return (
			<div className='embedded-wrapper'>
				<MessageCardBase
					isEmbedded
					message={message}
					setViewType={setViewType}
					viewType={viewType}
				/>
			</div>
		);
	}

	return <SplashScreen />;
}

export default EmbeddedMessage;
