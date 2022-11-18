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
import { Chip } from 'components/Chip';
import { AttachedMessagesIcon } from 'components/icons/AttachedMessagesIcon';
import { MessageIcon } from 'components/icons/MessageIcon';
import { useMessagesStore } from '../hooks/useMessagesStore';

type Offset = -1 | 1;

const AttachedMessagesSelection = () => {
	const messagesStore = useMessagesStore();

	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		setMessageIndex(0);
	}, [messagesStore.attachedMessages]);

	const selectAttachedMessage = (offset: Offset) => {
		const nextIndex = messageIndex + offset;
		const message = messagesStore.attachedMessages[nextIndex];

		if (message) {
			messagesStore.selectAttachedMessage(message);
			setMessageIndex(nextIndex);
		}
	};

	if (messagesStore.attachedMessages.length === 0 || !messagesStore.dataStore.messages.length) {
		return null;
	}

	return (
		<div className='attached-messages'>
			<button
				className='attached-messages__button previous'
				onClick={() => selectAttachedMessage(-1)}>
				<i />
				<span>Show previous</span>
			</button>
			<Chip>
				<MessageIcon />
				<AttachedMessagesIcon />
			</Chip>
			<span className='attached-messages__counter'>
				<span>{messageIndex + 1} </span>| {messagesStore.attachedMessages.length}
			</span>
			<button className='attached-messages__button next' onClick={() => selectAttachedMessage(1)}>
				<span>Show next</span>
				<i />
			</button>
		</div>
	);
};

export default observer(AttachedMessagesSelection);
