/** ****************************************************************************
 * Copyright 2020-2020 Exactpro (Exactpro Systems Limited)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 *you may not use this file except in compliance with the License.
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

import React, { useState, useEffect } from 'react';
import { MessageViewType, EventMessage } from '../../models/EventMessage';
import SplashScreen from '../SplashScreen';
import { MessageCardBase } from '../message/message-card/MessageCard';
import '../../styles/embedded.scss';
import moment from 'moment';

function EmbeddedMessagePanel() {
	const searchParams = new URLSearchParams(window.location.search);
	const session = searchParams.get('session');

	const [viewType, setViewType] = useState(MessageViewType.JSON);
	const [fetchedMessages, setFetchedMessages] = useState<EventMessage[]>([]);
	const [errorStatus, setErrorStatus] = useState<string | null>(null);
	const [requestPrevious, setRequestPrevious] = useState<string>('backend/search/sse/messages/?');
	const [requestNext, setRequestNext] = useState<string>('backend/search/sse/messages/?');

	useEffect(() => {
		getUrlRequest();
		getMessages();
	}, []);

	async function getMessages() {
		const resPrev = await fetch(`${requestPrevious}`);
		const resNext = await fetch(`${requestNext}`);

		if (resPrev.ok && resNext.ok) {
			setFetchedMessages(fetchedMessages.concat(await resPrev.json()));
			setFetchedMessages(fetchedMessages.concat(await resNext.json()));
		} else if (!resPrev.ok) {
			setErrorStatus(`${resPrev.status} ${resPrev.statusText}`);
		} else if (!resNext.ok) {
			setErrorStatus(`${resNext.status} ${resNext.statusText}`);
		}
	}

	function getUrlRequest() {
		const startTimestamp = moment(moment().utc().subtract(30, 'minutes').valueOf())
			.add(5, 'minutes')
			.valueOf();
		setRequestPrevious(
			requestPrevious =>
				requestPrevious +
				'startTimestamp=' +
				startTimestamp.toString() +
				'&stream=' +
				session +
				'&searchDirection=previous',
		);
		setRequestNext(
			requestNext =>
				requestNext +
				'startTimestamp=' +
				startTimestamp.toString() +
				'&stream=' +
				session +
				'&searchDirection=next',
		);
		console.log(requestPrevious);

		searchParams.forEach(param => {
			switch (param) {
				case 'body':
					setRequestPrevious(
						requestPrevious =>
							requestPrevious + '&filters=body&filters-values=' + searchParams.get('body'),
					);
					setRequestNext(
						requestNext => requestNext + '&filters=body&filters-values=' + searchParams.get('body'),
					);
					break;
				case 'bodyBinary':
					setRequestPrevious(
						requestPrevious =>
							requestPrevious +
							'&filters=bodyBinary&filters-values=' +
							searchParams.get('bodyBinary'),
					);
					setRequestNext(
						requestNext =>
							requestNext + '&filters=bodyBinary&filters-values=' + searchParams.get('bodyBinary'),
					);
					break;
				case 'Type':
					setRequestPrevious(
						requestPrevious =>
							requestPrevious + '&filters=type&filters-values=' + searchParams.get('type'),
					);
					setRequestNext(
						requestNext => requestNext + '&filters=type&filters-values=' + searchParams.get('type'),
					);
					break;
				// case 'attachedEventIds':
				// 	setCustomFilter(searchParams.get('attachedEventIds'));
				// setFilteredMessages(
				// 	fetchedMessages.filter(
				// 		message => message.sessionId === session && message. === customFilter,
				// 	),
				// );
				// break;
			}
			console.log(requestNext);
			console.log(requestPrevious);
		});
	}

	if (errorStatus) {
		throw new Error(errorStatus);
	}

	if (fetchedMessages) {
		return (
			<div className='embedded-wrapper'>
				{Array.isArray(fetchedMessages) ? (
					fetchedMessages.map((message, index) => (
						<MessageCardBase
							key={`body-${session}-${index}`}
							isEmbedded
							message={message}
							setViewType={setViewType}
							viewType={viewType}
						/>
					))
				) : (
					<MessageCardBase
						key={session}
						isEmbedded
						message={fetchedMessages}
						setViewType={setViewType}
						viewType={viewType}
					/>
				)}
			</div>
		);
	}
	return <SplashScreen />;
}

export default EmbeddedMessagePanel;
