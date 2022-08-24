/** ****************************************************************************
 * Copyright 2022-2022 Exactpro (Exactpro Systems Limited)
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

import { EventMessage, MessageViewType } from 'models/EventMessage';
import {
	isMessageValue,
	isSimpleValue,
	MessageBodyField,
	MessageBodyFields,
} from '../models/MessageBody';

export function normalizeFields(fields: MessageBodyFields) {
	return Object.entries(fields).reduce(
		(acc, [name, field]) => ({
			...acc,
			[name]: normalizeField(field),
		}),
		{},
	);
}

export function normalizeField(field: MessageBodyField): string | object {
	if (isSimpleValue(field)) return field.simpleValue;
	if (isMessageValue(field)) {
		return Object.entries(field.messageValue.fields || {}).reduce(
			(acc, [fieldName, fieldValue]) => ({
				...acc,
				[fieldName]: normalizeField(fieldValue),
			}),
			{},
		);
	}
	return field.listValue.values?.map(listValueField => normalizeField(listValueField)) || [];
}

export function isRawViewType(viewType: MessageViewType) {
	return viewType === MessageViewType.ASCII || viewType === MessageViewType.BINARY;
}

export function getDefaultViewTypesMap(message: EventMessage, defaultRule = MessageViewType.JSON) {
	const parsedMessages = (message.parsedMessages || []).map(pm => pm.id);
	return [message.id, ...parsedMessages].reduce((map, id) => {
		if (id === message.id) {
			map.set(id, getDefaultRawViewType(defaultRule));
		} else {
			map.set(id, getDefaultJSONViewType(defaultRule));
		}

		return map;
	}, new Map() as Map<string, MessageViewType>);
}

export function getDefaultRawViewType(viewType: MessageViewType) {
	return isRawViewType(viewType) ? viewType : MessageViewType.ASCII;
}

export function getDefaultJSONViewType(viewType: MessageViewType) {
	return !isRawViewType(viewType) ? viewType : MessageViewType.JSON;
}

type PartOfString = {
	text: string;
	isPrintable: boolean;
};

export function splitOnReadableParts(targetString: string): PartOfString[] {
	const stringParts = targetString.split(/\01/g);
	return stringParts.reduce((arr, curr) => {
		if (curr === '') return arr;
		arr.push({
			text: curr,
			isPrintable: true,
		});
		arr.push({
			text: '',
			isPrintable: false,
		});
		return arr;
	}, [] as PartOfString[]);
}
