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

import React from 'react';
import { observer } from 'mobx-react-lite';
import { useMessagesWorkspaceStore } from '../../hooks';

const AttachedMessagesSelection = () => {
	const messagesStore = useMessagesWorkspaceStore();

	const { attachedMessages } = messagesStore;

	const [messageIndex, setMessageIndex] = React.useState<number>(0);

	React.useEffect(() => {
		setMessageIndex(0);
	}, [attachedMessages]);

	const onPrevious = () => {
		if (messageIndex !== 0) {
			messagesStore.selectAttachedMessage(attachedMessages[messageIndex]);
			setMessageIndex(messageIndex - 1);
		}
	};

	const onNext = () => {
		if (messageIndex !== attachedMessages.length - 1) {
			messagesStore.selectAttachedMessage(attachedMessages[messageIndex]);
			setMessageIndex(messageIndex + 1);
		}
	};

	if (attachedMessages.length === 0) return null;

	return (
		<div className='messages-list__attached-messages'>
			<button className='messages-list__attached-messages-btn' onClick={onPrevious}>
				<div className='messages-list__attached-messages-btn-previous' />
			</button>
			<span className='messages-list__attached-messages-text'>Show previous</span>

			<span className='messages-list__attached-messages-text-counter'>
				<span className='messages-list__attached-messages-text-counter-current'>
					{messageIndex + 1}{' '}
				</span>
				| {attachedMessages.length}
			</span>
			<span className='messages-list__attached-messages-text'>Show next</span>
			<button className='messages-list__attached-messages-btn' onClick={onNext}>
				<div className='messages-list__attached-messages-btn-next' />
			</button>
		</div>
	);
};

export default observer(AttachedMessagesSelection);
