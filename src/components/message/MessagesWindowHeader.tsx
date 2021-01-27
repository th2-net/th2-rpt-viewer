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
import { createBemElement, createStyleSelector } from '../../helpers/styleCreators';
import {
	useMessagesWorkspaceStore,
	useMessageUpdateStore,
	useWorkspaceEventStore,
	useSelectedStore,
	useWorkspaceStore,
} from '../../hooks';
import MessagesFilter from '../filter/MessagesFilterPanel';
import { complement } from '../../helpers/array';

function MessagesWindowHeader() {
	const messagesStore = useMessagesWorkspaceStore();
	const messageUpdateStore = useMessageUpdateStore();
	const eventStore = useWorkspaceEventStore();
	const selectedStore = useSelectedStore();
	const workspaceStore = useWorkspaceStore();

	const [newSessions, setNewSessions] = React.useState<string[]>([]);
	const [showNewSessionsHint, setShowNewSessionsHint] = React.useState(false);

	const getStep = () => {
		const step =
			messagesStore.selectedMessageId &&
			messagesStore.selectedMessagesIds.includes(messagesStore.selectedMessageId.valueOf())
				? messagesStore.selectedMessagesIds.indexOf(messagesStore.selectedMessageId.valueOf()) + 1
				: 0;
		return `${step} of ${messagesStore.selectedMessagesIds.length}`;
	};

	React.useEffect(() => {
		setNewSessions(
			complement(
				workspaceStore.attachedMessagesStreams,
				messagesStore.filterStore.messagesFilter.streams,
			),
		);
	}, [workspaceStore.attachedMessagesStreams, messagesStore.filterStore.messagesFilter.streams]);

	const navButtonClass = createStyleSelector(
		'messages-window-header__button',
		messagesStore.selectedMessagesIds.length > 0 && messagesStore.messagesIds.length > 0
			? null
			: 'disabled',
	);

	const updateButtonClass = createBemElement(
		'messages-window-header',
		'realtime-button',
		messageUpdateStore.isSubscriptionActive ? 'active' : null,
	);

	return (
		<div className='messages-window-header'>
			<div className='messages-window-header__group'>
				<MessagesFilter />
				{newSessions.length > 0 && (
					<div
						className='sessions'
						onMouseOver={() => setShowNewSessionsHint(true)}
						onMouseLeave={() => setShowNewSessionsHint(false)}>
						<p className='sessions__title'>New sessions</p>{' '}
						<button className='sessions__add-button' onClick={messagesStore.applyStreams}>
							Add
						</button>
						{showNewSessionsHint && (
							<div className='sessions__content'>
								<div className='sessions__triangle' />
								<ul className='sessions__list'>
									{newSessions.map(session => (
										<li className='sessions__list-item' key={session}>
											{session}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				)}
			</div>
			<div className='messages-window-header__group'>
				<h2 className='messages-window-header__title'>
					{(messagesStore.isActivePanel || messagesStore.messagesIds.length === 0) &&
						(selectedStore.isLoadingEvents || workspaceStore.isLoadingAttachedMessages) && (
							<div className='messages-window-header__spinner' />
						)}
					Messages
					<div className='messages-window-header__count-list'>
						{eventStore.selectedEvent && eventStore.selectedEvent.attachedMessageIds.length > 0 && (
							<span className='messages-window-header__count'>
								{eventStore.selectedEvent.attachedMessageIds.length}
							</span>
						)}
					</div>
				</h2>
				<div className='messages-window-header__steps'>
					<div
						className={navButtonClass}
						role='button'
						title='previous'
						onClick={messagesStore.selectPrevMessage}
					/>
					<div
						className={navButtonClass}
						role='button'
						title='next'
						onClick={messagesStore.selectNextMessage}
					/>
					<div className='messages-window-header__steps-count'>{getStep()}</div>
				</div>
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
			</div>
		</div>
	);
}

export default observer(MessagesWindowHeader);
