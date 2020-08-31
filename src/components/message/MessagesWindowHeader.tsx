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
import { createStyleSelector } from '../../helpers/styleCreators';
import { useMessagesWindowStore } from '../../hooks/useMessagesStore';
import MessagesFilter from '../filter/MessagesFilterPanel';

const MessagesWindowHeader = () => {
	const messagesStore = useMessagesWindowStore();

	const getStep = () => {
		const step = messagesStore.selectedMessageId && messagesStore.selectedMessagesIds
			.includes(messagesStore.selectedMessageId.valueOf())
			? messagesStore.selectedMessagesIds.indexOf(messagesStore.selectedMessageId.valueOf()) + 1
			: 0;
		return `${step} of ${messagesStore.selectedMessagesIds.length}`;
	};

	const navButtonClass = createStyleSelector(
		'messages-window-header__button',
		messagesStore.selectedMessagesIds.length > 0
			? null : 'disabled',
	);

	return (
		<div className="messages-window-header">
			<div className="messages-window-header__group">
				<MessagesFilter />
			</div>
			<div className="messages-window-header__group">
				<h2 className="messages-window-header__title">
					Messages
				</h2>
				<div className="messages-window-header__steps">
					<div
						className={navButtonClass}
						role="button"
						title="previous"
						onClick={messagesStore.selectPrevMessage}/>
					<div
						className={navButtonClass}
						role="button"
						title="next"
						onClick={messagesStore.selectNextMessage}/>
					<div className="messages-window-header__steps-count">
						{getStep()}
					</div>
				</div>
			</div>
		</div>
	);
};

export default observer(MessagesWindowHeader);
