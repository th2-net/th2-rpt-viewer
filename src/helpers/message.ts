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
import { EventMessage, MessageViewTypeConfig, MessageViewType } from '../models/EventMessage';
import {
	isMessageValue,
	isNullValue,
	isSimpleValue,
	MessageBodyField,
	MessageBodyFields,
} from '../models/MessageBody';
import { timestampToNumber } from './date';
import { SavedMessageViewType } from '../stores/messages/SavedMessageViewType';

export const sortMessagesByTimestamp = (
	messages: Array<EventMessage>,
	order: 'desc' | 'asc' = 'desc',
) => {
	const copiedMessages = messages.slice();
	copiedMessages.sort((mesA, mesB) => {
		if (order === 'desc') {
			return timestampToNumber(mesB.timestamp) - timestampToNumber(mesA.timestamp);
		}
		return timestampToNumber(mesA.timestamp) - timestampToNumber(mesB.timestamp);
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

export function normalizeFields(fields: MessageBodyFields) {
	return Object.entries(fields).reduce((acc, [name, field]) => {
		return {
			...acc,
			[name]: normalizeField(field),
		};
	}, {});
}

export function normalizeField(field: MessageBodyField): string | object {
	if (isNullValue(field)) return field.nullValue;
	if (isSimpleValue(field)) return field.simpleValue;
	if (isMessageValue(field)) {
		return Object.entries(field.messageValue.fields || {}).reduce(
			(acc, [fieldName, fieldValue]) => {
				return {
					...acc,
					[fieldName]: normalizeField(fieldValue),
				};
			},
			{},
		);
	}
	return field.listValue.values?.map(listValueField => normalizeField(listValueField)) || [];
}

export function getViewTypesConfig(
	message: EventMessage,
	getSavedViewType: (message: EventMessage) => SavedMessageViewType,
) {
	const viewTypes = getSavedViewType(message).viewTypes;
	const config = new Map<string, MessageViewTypeConfig>();

	config.set(message.id, {
		viewType: viewTypes.get(message.id) as MessageViewType,
		setViewType: getSavedViewType(message).setViewType,
	});

	if (message.parsedMessages) {
		message.parsedMessages.forEach(parsedMessage => {
			config.set(parsedMessage.id, {
				viewType: viewTypes.get(parsedMessage.id) as MessageViewType,
				setViewType: getSavedViewType(message).setViewType,
			});
		});
	}

	return config;
}

export function defineViewTypeConfig(
	viewTypeConfig: Map<string, MessageViewTypeConfig>,
	id: string,
) {
	return viewTypeConfig.get(id) as MessageViewTypeConfig;
}
