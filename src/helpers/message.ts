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

import { ActionType } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { getTimestampAsNumber } from './date';

export const sortMessagesByTimestamp = (
	messages: Array<EventMessage>,
	order: 'desc' | 'asc' = 'desc',
) => {
	const copiedMessages = messages.slice();
	copiedMessages.sort((mesA, mesB) => {
		if (order === 'desc') {
			return getTimestampAsNumber(mesB.timestamp) - getTimestampAsNumber(mesA.timestamp);
		}
		return getTimestampAsNumber(mesA.timestamp) - getTimestampAsNumber(mesB.timestamp);
	});
	return copiedMessages;
};

export const isMessage = (object: unknown): object is EventMessage => {
	return (
		typeof object === 'object' &&
		object !== null &&
		(object as EventMessage).type === ActionType.MESSAGE
	);
};