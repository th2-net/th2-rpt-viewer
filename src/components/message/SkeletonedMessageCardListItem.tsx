/** ****************************************************************************
 * Copyright 2009-2020 Exactpro (Exactpro Systems Limited)
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
import { useStores } from '../../hooks/useStores';
import MessageCardSkeleton from './MessageCardSkeleton';
import MessageCard from './MessageCard';
import { EventMessage } from '../../models/EventMessage';
import useAsyncEffect from '../../hooks/useAsyncEffect';

interface Props {
	id: string;
}

const SkeletonedMessageCardListItem = observer(({ id }: Props) => {
	const [message, setMessage] = React.useState<null | EventMessage>(null);
	const { messagesStore } = useStores();

	useAsyncEffect(async () => {
		setMessage(await messagesStore.getMessageById(id));
	}, []);

	if (!message) {
		return <MessageCardSkeleton />;
	}

	return (
		<MessageCard
			key={message.messageId}
			message={message}/>
	);
});

export default SkeletonedMessageCardListItem;
