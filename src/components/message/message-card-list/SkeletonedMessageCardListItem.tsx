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
import MessageCardSkeleton from '../message-card/MessageCardSkeleton';
import MessageCard from '../message-card/MessageCard';
import { useMessagesDataStore } from '../../../hooks';
import ErrorMessageFallback from '../message-card/MessageErrorFallback';

interface Props {
	id: string;
}

function SkeletonedMessageCardListItem({ id }: Props) {
	const messagesDataStore = useMessagesDataStore();
	const message = messagesDataStore.messagesCache.get(id);
	const [isError, setIsError] = React.useState(false);

	React.useEffect(() => {
		const abortController = new AbortController();
		async function getMessage() {
			if (!message) {
				try {
					await messagesDataStore.fetchMessage(id, abortController.signal);
				} catch (error) {
					setIsError(true);
				}
			}
		}
		getMessage();
		return () => {
			abortController.abort();
		};
	}, []);

	if (isError) {
		return <ErrorMessageFallback errorMessage={`Error occurred while fetching message ${id}`} />;
	}

	if (!message) {
		return <MessageCardSkeleton />;
	}

	return <MessageCard key={message.id} message={message} />;
}

export default observer(SkeletonedMessageCardListItem);
