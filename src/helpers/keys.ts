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

import { EventAction } from 'models/EventAction';
import { EventMessage } from 'models/EventMessage';

/* eslint-disable no-restricted-globals */

const ACTION_KEY_PREFIX = 'action';
const MESSAGE_KEY_PREFIX = 'msg';
const VERIFICATION_KEY_PREFIX = 'verification';

export function keyForAction(id: number, fieldName: keyof EventAction | null = null): string {
	return `${ACTION_KEY_PREFIX}-${id}${fieldName ? `-${fieldName}` : ''}`;
}

export function keyForMessage(id: string, fieldName: keyof EventMessage | null = null): string {
	return `${MESSAGE_KEY_PREFIX}-${id}${fieldName ? `-${fieldName}` : ''}`;
}

export function keyForVerification(
	parentActionId: string | number | null,
	msgId: number | string,
): string {
	return `${ACTION_KEY_PREFIX}-${parentActionId}-${VERIFICATION_KEY_PREFIX}-${msgId}`;
}

export function isKeyForVerification(key: string): boolean {
	const [actionPrefix, actionId, verificationPrefix, msgId] = key.split('-');

	return (
		actionPrefix === ACTION_KEY_PREFIX &&
		!isNaN(+actionId) &&
		verificationPrefix === VERIFICATION_KEY_PREFIX &&
		!isNaN(+msgId)
	);
}
