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
import MessagesFilter from '../filter/MessagesFilterPanel';

function MessagesWindowHeader() {
	const messagesStore = useMessagesWorkspaceStore();

	// const updateButtonClass = createBemElement(
	// 	'messages-window-header',
	// 	'realtime-button',
	// 	messageUpdateStore.isSubscriptionActive ? 'active' : null,
	// );

	return (
		<div className='messages-window-header'>
			<div className='messages-window-header__group'>
				<MessagesFilter />
				{messagesStore.showFilterChangeHint && (
					<div className='sessions'>
						<p className='sessions__title'>Message may not match the filter</p>{' '}
						<button className='sessions__add-button' onClick={messagesStore.applyStreams}>
							Change filter
						</button>
					</div>
				)}
			</div>
			{/* <div className='messages-window-header__group'>
				{messagesStore.messagesIds.length > 0 && (
					<button onClick={messageUpdateStore.toggleSubscribe} className={updateButtonClass}>
						{messageUpdateStore.accumulatedMessages.length === 0 ? (
							<i className='messages-window-header__realtime-button-icon' />
						) : (
							<span
								className='messages-window-header__realtime-button-count'
								style={{
									fontSize: messageUpdateStore.accumulatedMessages.length > 99 ? '11px' : '14px',
								}}>
								{messageUpdateStore.accumulatedMessages.length}
							</span>
						)}
					</button>
				)}
			</div> */}
		</div>
	);
}

export default observer(MessagesWindowHeader);
