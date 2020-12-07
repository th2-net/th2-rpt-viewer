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

import { EventAction } from '../models/EventAction';
import { EventMessage } from '../models/EventMessage';
import { getTimestampAsNumber } from './date';
import { isEventAction } from './event';

export function getMinifiedStatus(status: string): string {
	return status
		.split('_')
		.map(str => str[0])
		.join('')
		.toUpperCase();
}

export function mapToTimestamps(list: EventAction[] | EventMessage[]) {
	return isEventAction(list[0])
		? (list as EventAction[]).map(item => getTimestampAsNumber(item.startTimestamp))
		: (list as EventMessage[]).map(item => getTimestampAsNumber(item.timestamp));
}
