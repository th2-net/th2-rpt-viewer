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

import { EventAction } from '../models/EventAction';
import { EventStatus } from '../models/Status';

export const isRootEvent = (event: EventAction) => event.parentEventId === null;

export const getEventStatus = (event: EventAction): EventStatus => {
	const { body, eventType, successful } = event;
	if (!body || eventType !== 'verification') {
		return successful ? EventStatus.PASSED : EventStatus.FAILED;
	}

	if (Array.isArray(body)) {
		const status = body.find(field => field.type === 'verification')?.status;
		return status !== undefined
			? status
			: successful
				? EventStatus.PASSED : EventStatus.FAILED;
	}

	return body.status;
};

export function isVerification(event: EventAction) {
	if (event.body == null) {
		return false;
	}

	if (Array.isArray(event.body)) {
		return event.body.some(element => element.type === 'verification');
	}

	if (typeof event.body === 'object') {
		return event.body.type === 'verification';
	}

	return false;
}
