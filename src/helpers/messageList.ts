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

import { EventMessage, EventMessageItem } from '../models/EventMessage';

export default function getMessageList(
	messages: EventMessage[],
	previousMessageList: EventMessage[],
) {
	const tempMessageList: EventMessageItem[] = [];
	messages
		.filter(message => !previousMessageList.includes(message))
		.forEach(message => {
			if (message.parsedMessages) {
				message.parsedMessages.forEach(parsedMessage => {
					const { parsedMessages, ...rest } = message;
					const tempMessageItem: EventMessageItem = {
						...rest,
						parsedMessage: null,
						parsedMessages: [],
					};

					tempMessageItem.parsedMessage = message.parsedMessages ? parsedMessage : null;
					if (tempMessageItem.parsedMessages && tempMessageItem.parsedMessage)
						tempMessageItem.parsedMessages[0] = tempMessageItem.parsedMessage;
					tempMessageList.push(tempMessageItem);
				});
			} else {
				tempMessageList.push(message as EventMessageItem);
			}
		});
	return tempMessageList;
}
