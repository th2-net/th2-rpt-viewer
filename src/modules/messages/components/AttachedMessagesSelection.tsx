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

import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useMessagesStore } from '../hooks/useMessagesStore';

const AttachedMessagesSelection = () => {
	const messagesStore = useMessagesStore();

	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		setMessageIndex(0);
	}, [messagesStore.attachedMessages]);

	const onPrevious = () => {
		if (messageIndex > 0) {
			const nextIndex = messageIndex - 1;
			messagesStore.selectAttachedMessage(messagesStore.attachedMessages[nextIndex]);
			setMessageIndex(nextIndex);
		}
	};

	const onNext = () => {
		if (messageIndex !== messagesStore.attachedMessages.length - 1) {
			const nextIndex = messageIndex + 1;
			messagesStore.selectAttachedMessage(messagesStore.attachedMessages[nextIndex]);
			setMessageIndex(nextIndex);
		}
	};

	if (messagesStore.attachedMessages.length === 0 || !messagesStore.dataStore.messages.length) {
		return null;
	}

	return (
		<div className='messages-list__attached-messages'>
			<button className='messages-list__attached-messages-btn' onClick={onPrevious}>
				<div className='messages-list__attached-messages-btn-previous' />
				<span className='messages-list__attached-messages-text'>Show previous</span>
			</button>
			<span className='messages-list__attached-messages-text-counter'>
				<span className='messages-list__attached-messages-text-counter-current'>
					{messageIndex + 1}{' '}
				</span>
				| {messagesStore.attachedMessages.length}
			</span>
			<button className='messages-list__attached-messages-btn' onClick={onNext}>
				<span className='messages-list__attached-messages-text'>Show next</span>
				<div className='messages-list__attached-messages-btn-next' />
			</button>
		</div>
	);
};

export default observer(AttachedMessagesSelection);
